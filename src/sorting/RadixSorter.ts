import { GPUContext } from '../core/GPUContext';
import { BufferManager } from '../core/BufferManager';
import { SortResult } from '../types';
import { ShaderCompilationError } from '../core/errors';
import radixShaderCode from '../shaders/radix.wgsl?raw';

const WORKGROUP_SIZE = 256;
const RADIX = 16; // 4-bit radix
const BITS_PER_PASS = 4;
const NUM_PASSES = 8; // 32 bits / 4 bits per pass

/**
 * GPU-accelerated Radix Sort implementation
 */
export class RadixSorter {
  private device: GPUDevice;
  private bufferManager: BufferManager;
  private histogramPipeline: GPUComputePipeline | null = null;
  private scatterPipeline: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private initialized = false;

  constructor(context: GPUContext) {
    this.device = context.getDevice();
    this.bufferManager = new BufferManager(this.device);
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

    this.initialized = true;
  }

  /**
   * Compute exclusive prefix sum on CPU (for simplicity)
   * Histogram is flattened as [digit0_wg0..digit0_wgN, digit1_wg0..]
   */
  private computePrefixSum(histogram: Uint32Array): Uint32Array {
    const prefixSum = new Uint32Array(histogram.length);
    let sum = 0;
    for (let i = 0; i < histogram.length; i++) {
      prefixSum[i] = sum;
      sum += histogram[i];
    }
    return prefixSum;
  }

  /**
   * Sort an array using GPU radix sort
   */
  async sort(data: Uint32Array): Promise<SortResult> {
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

    // Create buffers
    let inputBuffer = this.bufferManager.createStorageBuffer(data, 'radix-input');
    let outputBuffer = this.device.createBuffer({
      label: 'radix-output',
      size: BufferManager.alignSize(size * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const histogramBuffer = this.device.createBuffer({
      label: 'radix-histogram',
      size: BufferManager.alignSize(histogramSize * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const prefixSumBuffer = this.device.createBuffer({
      label: 'radix-prefix-sum',
      size: BufferManager.alignSize(histogramSize * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const uniformBuffer = this.bufferManager.createUniformBuffer(16, 'radix-uniforms');

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
          { binding: 0, resource: { buffer: inputBuffer } },
          { binding: 1, resource: { buffer: outputBuffer } },
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

      // Step 2: Read histogram and compute prefix sum on CPU
      await this.device.queue.onSubmittedWorkDone();

      const stagingBuffer = this.device.createBuffer({
        size: BufferManager.alignSize(histogramSize * 4, 4),
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      {
        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(histogramBuffer, 0, stagingBuffer, 0, histogramSize * 4);
        this.device.queue.submit([commandEncoder.finish()]);
      }

      await stagingBuffer.mapAsync(GPUMapMode.READ);
      const histogram = new Uint32Array(stagingBuffer.getMappedRange().slice(0));
      stagingBuffer.unmap();
      stagingBuffer.destroy();

      // Compute prefix sum
      const prefixSums = this.computePrefixSum(histogram);
      this.device.queue.writeBuffer(
        prefixSumBuffer,
        0,
        prefixSums.buffer,
        prefixSums.byteOffset,
        prefixSums.byteLength
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
      const temp = inputBuffer;
      inputBuffer = outputBuffer;
      outputBuffer = temp;
    }

    await this.device.queue.onSubmittedWorkDone();

    const gpuEndTime = performance.now();

    // Read results (inputBuffer has final sorted data after even number of swaps)
    const result = await this.bufferManager.readBuffer(inputBuffer, size * 4);

    // Cleanup
    inputBuffer.destroy();
    outputBuffer.destroy();
    histogramBuffer.destroy();
    prefixSumBuffer.destroy();
    this.bufferManager.releaseBuffer(uniformBuffer);

    const totalEndTime = performance.now();

    return {
      sortedData: result,
      gpuTimeMs: gpuEndTime - gpuStartTime,
      totalTimeMs: totalEndTime - totalStartTime,
    };
  }

  /**
   * Release all resources
   */
  destroy(): void {
    this.bufferManager.releaseAll();
    this.histogramPipeline = null;
    this.scatterPipeline = null;
    this.bindGroupLayout = null;
    this.initialized = false;
  }
}
