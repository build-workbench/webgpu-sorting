import { GPUContext } from '../core/GPUContext';
import { BufferManager } from '../core/BufferManager';
import { BufferScope } from '../core/BufferScope';
import { SortResult, SortOptions } from '../shared/types';
import { ShaderCompilationError } from '../core/errors';
import { Validator } from '../core/Validator';
import { ScanModule } from './scan/ScanModule';
import radixShaderCode from '../shaders/radix.wgsl?raw';
import { WORKGROUP_SIZE, RADIX, BITS_PER_PASS, NUM_PASSES } from '../shared/constants';

/**
 * GPU-accelerated Radix Sort implementation with GPU-based prefix sum
 */
export class RadixSorter {
  private device: GPUDevice;
  private bufferManager: BufferManager;
  private scanModule: ScanModule;

  private histogramPipeline: GPUComputePipeline | null = null;
  private scatterPipeline: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;

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
    this.scanModule = new ScanModule(context);
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

    const { elementsPerScanBlock } = ScanModule.getConstants();
    const numWorkgroups = Math.ceil(maxSize / WORKGROUP_SIZE);
    const histogramSize = RADIX * numWorkgroups;
    const numScanBlocks = Math.ceil(histogramSize / elementsPerScanBlock);

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

    // Initialize scan module
    await this.scanModule.initialize();

    this.initialized = true;
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

    const { elementsPerScanBlock } = ScanModule.getConstants();
    const numWorkgroups = Math.ceil(size / WORKGROUP_SIZE);
    const histogramSize = RADIX * numWorkgroups;
    const numScanBlocks = Math.ceil(histogramSize / elementsPerScanBlock);

    // Check if preallocated buffers can be used
    const preallocatedBuffers = this.preallocatedBuffers;
    const usePreallocated = preallocatedBuffers !== null && this._preallocatedSize >= size;
    const bufferScope = new BufferScope();

    let inputBuffer: GPUBuffer;
    let outputBuffer: GPUBuffer;
    let histogramBuffer: GPUBuffer;
    let prefixSumBuffer: GPUBuffer;
    let blockSumsBuffer: GPUBuffer;

    let sortedData: Uint32Array | undefined;
    let gpuTimeMs: number | undefined;

    try {
      let uniformBuffer: GPUBuffer;
      let scanUniformBuffer: GPUBuffer;

      if (usePreallocated) {
        this.device.queue.writeBuffer(
          preallocatedBuffers.input,
          0,
          data.buffer,
          data.byteOffset,
          data.byteLength
        );
        inputBuffer = preallocatedBuffers.input;
        outputBuffer = preallocatedBuffers.output;
        histogramBuffer = preallocatedBuffers.histogram;
        prefixSumBuffer = preallocatedBuffers.prefixSum;
        blockSumsBuffer = preallocatedBuffers.blockSums;

        uniformBuffer = bufferScope.track(
          this.bufferManager.createUniformBuffer(16, 'radix-uniforms'),
          (buffer) => this.bufferManager.releaseBuffer(buffer)
        );
        scanUniformBuffer = bufferScope.track(
          this.bufferManager.createUniformBuffer(16, 'scan-uniforms'),
          (buffer) => this.bufferManager.releaseBuffer(buffer)
        );
      } else {
        inputBuffer = bufferScope.track(
          this.bufferManager.createStorageBuffer(data, 'radix-input'),
          (buffer) => this.bufferManager.releaseBuffer(buffer)
        );
        outputBuffer = bufferScope.track(
          this.device.createBuffer({
            label: 'radix-output',
            size: BufferManager.alignSize(size * 4, 4),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
          })
        );
        histogramBuffer = bufferScope.track(
          this.device.createBuffer({
            label: 'radix-histogram',
            size: BufferManager.alignSize(histogramSize * 4, 4),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
          })
        );
        prefixSumBuffer = bufferScope.track(
          this.device.createBuffer({
            label: 'radix-prefix-sum',
            size: BufferManager.alignSize(histogramSize * 4, 4),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
          })
        );
        blockSumsBuffer = bufferScope.track(
          this.device.createBuffer({
            label: 'radix-block-sums',
            size: BufferManager.alignSize(numScanBlocks * 4, 4),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
          })
        );
        uniformBuffer = bufferScope.track(
          this.bufferManager.createUniformBuffer(16, 'radix-uniforms'),
          (buffer) => this.bufferManager.releaseBuffer(buffer)
        );
        scanUniformBuffer = bufferScope.track(
          this.bufferManager.createUniformBuffer(16, 'scan-uniforms'),
          (buffer) => this.bufferManager.releaseBuffer(buffer)
        );
      }

      let currentInput = inputBuffer;
      let currentOutput = outputBuffer;

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
        this.scanModule.computePrefixSumGPU(
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
      sortedData = await this.bufferManager.readBuffer(currentInput, size * 4);
      gpuTimeMs = gpuEndTime - gpuStartTime;
    } finally {
      bufferScope.releaseAll();
    }

    if (!sortedData) {
      throw new Error('Radix sort completed without producing output');
    }
    if (gpuTimeMs === undefined) {
      throw new Error('Radix sort completed without timing information');
    }

    const totalEndTime = performance.now();

    // Validate if requested
    if (options?.validate) {
      const validation = Validator.validate(data, sortedData);
      if (!validation.isValid) {
        throw new Error(`Sort validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return {
      sortedData,
      gpuTimeMs,
      totalTimeMs: totalEndTime - totalStartTime,
    };
  }

  /**
   * Release all resources
   */
  destroy(): void {
    this.clearPreallocation();
    this.bufferManager.releaseAll();
    this.scanModule.destroy();
    this.histogramPipeline = null;
    this.scatterPipeline = null;
    this.bindGroupLayout = null;
    this.initialized = false;
  }
}
