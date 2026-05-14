import { GPUContext } from '../core/GPUContext';
import { BufferManager } from '../core/BufferManager';
import { SortResult, SortOptions } from '../shared/types';
import { ShaderCompilationError } from '../core/errors';
import { Validator } from '../core/Validator';
import radixShaderCode from '../shaders/radix.wgsl?raw';
import { WORKGROUP_SIZE, RADIX, BITS_PER_PASS, NUM_PASSES } from '../shared/constants';

/**
 * IMPORTANT: These constants must match the values in src/shaders/radix.wgsl
 * @see src/shaders/radix.wgsl:14-15 - const WORKGROUP_SIZE: u32 = 256u; const RADIX: u32 = 16u;
 * @see src/shaders/radix.wgsl:16 - const SCAN_WORKGROUP_SIZE: u32 = 256u;
 */

/** Size for Blelloch scan workgroups */
const SCAN_WORKGROUP_SIZE = 256;
/** Elements processed per scan workgroup (each thread handles 2 elements) */
const ELEMENTS_PER_SCAN_BLOCK = SCAN_WORKGROUP_SIZE * 2;

/**
 * GPU-accelerated Radix Sort implementation with GPU-based prefix sum
 */
export class RadixSorter {
  private device: GPUDevice;
  private bufferManager: BufferManager;
  private histogramPipeline: GPUComputePipeline | null = null;
  private scatterPipeline: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;

  // Blelloch scan pipelines
  private blellochScanPipeline: GPUComputePipeline | null = null;
  private scanBlockSumsPipeline: GPUComputePipeline | null = null;
  private addBlockPrefixesPipeline: GPUComputePipeline | null = null;
  private scanBindGroupLayout: GPUBindGroupLayout | null = null;

  // Preallocation state
  private preallocatedBuffers: {
    input: GPUBuffer;
    output: GPUBuffer;
    histogram: GPUBuffer;
    prefixSum: GPUBuffer;
    blockSums: GPUBuffer;
  } | null = null;

  private _preallocatedSize: number = 0;

  private initialized = false;

  constructor(context: GPUContext) {
    this.device = context.getDevice();
    this.bufferManager = new BufferManager(this.device);
  }

  /**
   * The current preallocation size, or 0 if not preallocated.
   */
  get preallocatedSize(): number {
    return this._preallocatedSize;
  }

  /**
   * Preallocate GPU buffers for sorting arrays up to maxSize.
   * Reuse buffers across multiple sort() calls for better performance.
   * @param maxSize - Maximum array size to preallocate for
   */
  preallocate(maxSize: number): void {
    // Release any existing preallocation
    this.clearPreallocation();

    const numWorkgroups = Math.ceil(maxSize / WORKGROUP_SIZE);
    const histogramSize = RADIX * numWorkgroups;
    const numScanBlocks = Math.ceil(histogramSize / ELEMENTS_PER_SCAN_BLOCK);

    this.preallocatedBuffers = {
      input: this.device.createBuffer({
        label: 'preallocated-radix-input',
        size: BufferManager.alignSize(maxSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
      output: this.device.createBuffer({
        label: 'preallocated-radix-output',
        size: BufferManager.alignSize(maxSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
      histogram: this.device.createBuffer({
        label: 'preallocated-radix-histogram',
        size: BufferManager.alignSize(histogramSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
      prefixSum: this.device.createBuffer({
        label: 'preallocated-radix-prefix-sum',
        size: BufferManager.alignSize(histogramSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
      blockSums: this.device.createBuffer({
        label: 'preallocated-radix-block-sums',
        size: BufferManager.alignSize(numScanBlocks * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      }),
    };

    this._preallocatedSize = maxSize;
  }

  /**
   * Release preallocated buffers. Buffers will be allocated on-demand.
   */
  clearPreallocation(): void {
    if (this.preallocatedBuffers) {
      this.preallocatedBuffers.input.destroy();
      this.preallocatedBuffers.output.destroy();
      this.preallocatedBuffers.histogram.destroy();
      this.preallocatedBuffers.prefixSum.destroy();
      this.preallocatedBuffers.blockSums.destroy();
      this.preallocatedBuffers = null;
      this._preallocatedSize = 0;
    }
  }

  /**
   * Initialize shader pipelines
   */
  private async initializePipelines(): Promise<void> {
    if (this.initialized) return;

    const shaderModule = this.device.createShaderModule({
      label: 'radix-sort-shader',
      code: radixShaderCode,
    });

    const compilationInfo = await shaderModule.getCompilationInfo();
    const errors = compilationInfo.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      throw new ShaderCompilationError(
        `Radix shader compilation failed: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'radix-bind-group-layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      label: 'radix-pipeline-layout',
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.histogramPipeline = this.device.createComputePipeline({
      label: 'radix-histogram-pipeline',
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'compute_histogram',
      },
    });

    this.scatterPipeline = this.device.createComputePipeline({
      label: 'radix-scatter-pipeline',
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'scatter',
      },
    });

    // Create scan bind group layout for Blelloch scan
    this.scanBindGroupLayout = this.device.createBindGroupLayout({
      label: 'scan-bind-group-layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    const scanPipelineLayout = this.device.createPipelineLayout({
      label: 'scan-pipeline-layout',
      bindGroupLayouts: [this.scanBindGroupLayout],
    });

    // Create Blelloch scan pipelines
    this.blellochScanPipeline = this.device.createComputePipeline({
      label: 'blelloch-scan-pipeline',
      layout: scanPipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'blelloch_scan',
      },
    });

    this.scanBlockSumsPipeline = this.device.createComputePipeline({
      label: 'scan-block-sums-pipeline',
      layout: scanPipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'scan_block_sums',
      },
    });

    this.addBlockPrefixesPipeline = this.device.createComputePipeline({
      label: 'add-block-prefixes-pipeline',
      layout: scanPipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'add_block_prefixes',
      },
    });

    this.initialized = true;
  }

  /**
   * Compute exclusive prefix sum on GPU using Blelloch scan
   * Uses a two-level scan for large histograms:
   * 1. Local scan within each workgroup
   * 2. Scan of block sums
   * 3. Add block prefixes to local results
   */
  private computePrefixSumGPU(
    inputBuffer: GPUBuffer,
    outputBuffer: GPUBuffer,
    blockSumsBuffer: GPUBuffer,
    scanUniformBuffer: GPUBuffer,
    dataSize: number
  ): void {
    const scanBindGroupLayout = this.scanBindGroupLayout;
    const blellochPipeline = this.blellochScanPipeline;
    const scanBlockSumsPipeline = this.scanBlockSumsPipeline;
    const addBlockPrefixesPipeline = this.addBlockPrefixesPipeline;

    if (
      !scanBindGroupLayout ||
      !blellochPipeline ||
      !scanBlockSumsPipeline ||
      !addBlockPrefixesPipeline
    ) {
      throw new ShaderCompilationError('Scan pipelines not initialized');
    }

    // Calculate number of scan blocks
    const numScanBlocks = Math.ceil(dataSize / ELEMENTS_PER_SCAN_BLOCK);

    // Update scan uniforms
    const scanUniformData = new Uint32Array([dataSize, numScanBlocks, 0, 0]);
    this.device.queue.writeBuffer(scanUniformBuffer, 0, scanUniformData);

    // Step 1: Local Blelloch scan within each workgroup
    {
      const bindGroup = this.device.createBindGroup({
        label: 'blelloch-scan-bind-group',
        layout: scanBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: inputBuffer } },
          { binding: 1, resource: { buffer: outputBuffer } },
          { binding: 2, resource: { buffer: blockSumsBuffer } },
          { binding: 3, resource: { buffer: scanUniformBuffer } },
        ],
      });

      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(blellochPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(numScanBlocks);
      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);
    }

    // Step 2: Scan the block sums (if more than one block)
    if (numScanBlocks > 1) {
      const bindGroup = this.device.createBindGroup({
        label: 'scan-block-sums-bind-group',
        layout: scanBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: blockSumsBuffer } },
          { binding: 1, resource: { buffer: blockSumsBuffer } },
          { binding: 2, resource: { buffer: blockSumsBuffer } },
          { binding: 3, resource: { buffer: scanUniformBuffer } },
        ],
      });

      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(scanBlockSumsPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(1);
      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);

      // Step 3: Add block prefixes to each block's local results
      {
        const bindGroup = this.device.createBindGroup({
          label: 'add-block-prefixes-bind-group',
          layout: scanBindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: inputBuffer } },
            { binding: 1, resource: { buffer: outputBuffer } },
            { binding: 2, resource: { buffer: blockSumsBuffer } },
            { binding: 3, resource: { buffer: scanUniformBuffer } },
          ],
        });

        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(addBlockPrefixesPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(numScanBlocks);
        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);
      }
    }
  }

  /**
   * Sort an array using GPU radix sort
   * @param data - The array to sort
   * @param options - Optional sorting options
   */
  async sort(data: Uint32Array, options?: SortOptions): Promise<SortResult> {
    const totalStartTime = performance.now();

    await this.initializePipelines();

    const size = data.length;

    if (size <= 1) {
      return {
        sortedData: new Uint32Array(data),
        gpuTimeMs: 0,
        totalTimeMs: performance.now() - totalStartTime,
      };
    }

    const numWorkgroups = Math.ceil(size / WORKGROUP_SIZE);
    const histogramSize = RADIX * numWorkgroups;
    const numScanBlocks = Math.ceil(histogramSize / ELEMENTS_PER_SCAN_BLOCK);

    // Check if preallocated buffers can be used
    const usePreallocated = this.preallocatedBuffers && this._preallocatedSize >= size;

    let inputBuffer: GPUBuffer;
    let outputBuffer: GPUBuffer;
    let histogramBuffer: GPUBuffer;
    let prefixSumBuffer: GPUBuffer;
    let blockSumsBuffer: GPUBuffer;
    let uniformBuffer: GPUBuffer;
    let scanUniformBuffer: GPUBuffer;
    let needsCleanup = false;

    if (usePreallocated) {
      // Write data to preallocated input buffer
      this.device.queue.writeBuffer(
        this.preallocatedBuffers!.input,
        0,
        data.buffer,
        data.byteOffset,
        data.byteLength
      );
      inputBuffer = this.preallocatedBuffers!.input;
      outputBuffer = this.preallocatedBuffers!.output;
      histogramBuffer = this.preallocatedBuffers!.histogram;
      prefixSumBuffer = this.preallocatedBuffers!.prefixSum;
      blockSumsBuffer = this.preallocatedBuffers!.blockSums;

      // Uniform and scan uniform buffers are small, allocate on-demand
      uniformBuffer = this.bufferManager.createUniformBuffer(16, 'radix-uniforms');
      scanUniformBuffer = this.bufferManager.createUniformBuffer(16, 'scan-uniforms');
    } else {
      // Fall back to temporary allocation
      inputBuffer = this.bufferManager.createStorageBuffer(data, 'radix-input');
      outputBuffer = this.device.createBuffer({
        label: 'radix-output',
        size: BufferManager.alignSize(size * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      });
      histogramBuffer = this.device.createBuffer({
        label: 'radix-histogram',
        size: BufferManager.alignSize(histogramSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      });
      prefixSumBuffer = this.device.createBuffer({
        label: 'radix-prefix-sum',
        size: BufferManager.alignSize(histogramSize * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      });
      blockSumsBuffer = this.device.createBuffer({
        label: 'radix-block-sums',
        size: BufferManager.alignSize(numScanBlocks * 4, 4),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      });
      uniformBuffer = this.bufferManager.createUniformBuffer(16, 'radix-uniforms');
      scanUniformBuffer = this.bufferManager.createUniformBuffer(16, 'scan-uniforms');
      needsCleanup = true;
    }

    // Track current input/output for swapping
    let currentInput = inputBuffer;
    let currentOutput = outputBuffer;

    const cleanupTempBuffers = () => {
      // Only destroy non-preallocated buffers
      if (needsCleanup) {
        inputBuffer.destroy();
        outputBuffer.destroy();
        histogramBuffer.destroy();
        prefixSumBuffer.destroy();
        blockSumsBuffer.destroy();
      }
      // Always clean up small uniform buffers
      this.bufferManager.releaseBuffer(uniformBuffer);
      this.bufferManager.releaseBuffer(scanUniformBuffer);
    };

    try {
      const gpuStartTime = performance.now();

      // Perform 8 passes (4 bits each)
      for (let pass = 0; pass < NUM_PASSES; pass++) {
        const bitOffset = pass * BITS_PER_PASS;

        // Clear histogram
        const zeroHistogram = new Uint32Array(histogramSize);
        this.device.queue.writeBuffer(histogramBuffer, 0, zeroHistogram);

        // Update uniforms
        const uniformData = new Uint32Array([bitOffset, size, numWorkgroups, 0]);
        this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        // Create bind group for this pass
        const bindGroupLayout = this.bindGroupLayout;
        if (!bindGroupLayout) {
          throw new ShaderCompilationError('Shader pipelines not initialized');
        }

        const bindGroup = this.device.createBindGroup({
          label: `radix-bind-group-pass-${pass}`,
          layout: bindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: currentInput } },
            { binding: 1, resource: { buffer: currentOutput } },
            { binding: 2, resource: { buffer: histogramBuffer } },
            { binding: 3, resource: { buffer: prefixSumBuffer } },
            { binding: 4, resource: { buffer: uniformBuffer } },
          ],
        });

        // Step 1: Compute histogram
        {
          const histogramPipeline = this.histogramPipeline;
          if (!histogramPipeline) {
            throw new ShaderCompilationError('Histogram pipeline not initialized');
          }

          const commandEncoder = this.device.createCommandEncoder();
          const passEncoder = commandEncoder.beginComputePass();
          passEncoder.setPipeline(histogramPipeline);
          passEncoder.setBindGroup(0, bindGroup);
          passEncoder.dispatchWorkgroups(numWorkgroups);
          passEncoder.end();
          this.device.queue.submit([commandEncoder.finish()]);
        }

        // Step 2: Compute prefix sum on GPU using Blelloch scan
        this.computePrefixSumGPU(
          histogramBuffer,
          prefixSumBuffer,
          blockSumsBuffer,
          scanUniformBuffer,
          histogramSize
        );

        // Step 3: Scatter elements
        {
          const scatterPipeline = this.scatterPipeline;
          if (!scatterPipeline) {
            throw new ShaderCompilationError('Scatter pipeline not initialized');
          }

          const commandEncoder = this.device.createCommandEncoder();
          const passEncoder = commandEncoder.beginComputePass();
          passEncoder.setPipeline(scatterPipeline);
          passEncoder.setBindGroup(0, bindGroup);
          passEncoder.dispatchWorkgroups(numWorkgroups);
          passEncoder.end();
          this.device.queue.submit([commandEncoder.finish()]);
        }

        // Swap buffers for next pass
        const temp = currentInput;
        currentInput = currentOutput;
        currentOutput = temp;
      }

      await this.device.queue.onSubmittedWorkDone();

      const gpuEndTime = performance.now();

      // Read results (currentInput has final sorted data after even number of swaps)
      const result = await this.bufferManager.readBuffer(currentInput, size * 4);

      const totalEndTime = performance.now();

      // Validate if requested
      if (options?.validate) {
        const validation = Validator.validate(data, result);
        if (!validation.isValid) {
          throw new Error(`Sort validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return {
        sortedData: result,
        gpuTimeMs: gpuEndTime - gpuStartTime,
        totalTimeMs: totalEndTime - totalStartTime,
      };
    } finally {
      // Cleanup - guaranteed to run even if an exception is thrown
      cleanupTempBuffers();
    }
  }

  /**
   * Release all resources
   */
  destroy(): void {
    this.clearPreallocation();
    this.bufferManager.releaseAll();
    this.histogramPipeline = null;
    this.scatterPipeline = null;
    this.bindGroupLayout = null;
    this.blellochScanPipeline = null;
    this.scanBlockSumsPipeline = null;
    this.addBlockPrefixesPipeline = null;
    this.scanBindGroupLayout = null;
    this.initialized = false;
  }
}
