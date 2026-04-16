import { GPUContext } from '../core/GPUContext';
import { BufferManager } from '../core/BufferManager';
import { SortResult } from '../types';
import { ShaderCompilationError } from '../core/errors';
import bitonicShaderCode from '../shaders/bitonic.wgsl?raw';

const WORKGROUP_SIZE = 256;

/**
 * GPU-accelerated Bitonic Sort implementation
 */
export class BitonicSorter {
  private device: GPUDevice;
  private bufferManager: BufferManager;
  private localPipeline: GPUComputePipeline | null = null;
  private globalPipeline: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;
  private initialized = false;

  constructor(context: GPUContext) {
    this.device = context.getDevice();
    this.bufferManager = new BufferManager(this.device);
  }

  /**
   * Calculate the next power of 2 >= n
   */
  static nextPowerOf2(n: number): number {
    if (n <= 0) return 1;
    if ((n & (n - 1)) === 0) return n; // Already power of 2

    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  /**
   * Check if n is a power of 2
   */
  static isPowerOf2(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  /**
   * Initialize shader pipelines
   */
  private async initializePipelines(): Promise<void> {
    if (this.initialized) return;

    // Create shader module
    const shaderModule = this.device.createShaderModule({
      label: 'bitonic-sort-shader',
      code: bitonicShaderCode,
    });

    // Check for compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    const errors = compilationInfo.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      throw new ShaderCompilationError(
        `Bitonic shader compilation failed: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    // Create bind group layout
    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'bitonic-bind-group-layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      label: 'bitonic-pipeline-layout',
      bindGroupLayouts: [this.bindGroupLayout],
    });

    // Create local sort pipeline
    this.localPipeline = this.device.createComputePipeline({
      label: 'bitonic-local-pipeline',
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'bitonic_sort_local',
      },
    });

    // Create global sort pipeline
    this.globalPipeline = this.device.createComputePipeline({
      label: 'bitonic-global-pipeline',
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: 'bitonic_sort_global',
      },
    });

    this.initialized = true;
  }

  /**
   * Sort an array using GPU bitonic sort
   */
  async sort(data: Uint32Array): Promise<SortResult> {
    const totalStartTime = performance.now();

    await this.initializePipelines();

    const originalSize = data.length;

    // Handle empty or single element arrays
    if (originalSize <= 1) {
      return {
        sortedData: new Uint32Array(data),
        gpuTimeMs: 0,
        totalTimeMs: performance.now() - totalStartTime,
      };
    }

    // Pad to power of 2
    const paddedSize = BitonicSorter.nextPowerOf2(originalSize);
    const paddedData = new Uint32Array(paddedSize);
    paddedData.set(data);
    // Fill padding with max value
    for (let i = originalSize; i < paddedSize; i++) {
      paddedData[i] = 0xffffffff;
    }

    // Create GPU buffers
    const dataBuffer = this.bufferManager.createStorageBuffer(paddedData, 'sort-data');
    const uniformBuffer = this.bufferManager.createUniformBuffer(16, 'sort-uniforms');

    // Create bind group
    const bindGroupLayout = this.bindGroupLayout;
    if (!bindGroupLayout) {
      throw new ShaderCompilationError('Shader pipelines not initialized');
    }

    const bindGroup = this.device.createBindGroup({
      label: 'bitonic-bind-group',
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: dataBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } },
      ],
    });

    const gpuStartTime = performance.now();

    // Calculate number of workgroups
    const numWorkgroups = Math.ceil(paddedSize / WORKGROUP_SIZE);
    const numStages = Math.log2(paddedSize);

    // First, do local sort within each workgroup
    {
      const localPipeline = this.localPipeline;
      if (!localPipeline) {
        throw new ShaderCompilationError('Local pipeline not initialized');
      }

      const uniformData = new Uint32Array([0, 0, paddedSize, 0]);
      this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(localPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(numWorkgroups);
      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);
    }

    // Then do global merge stages
    const localStages = Math.log2(WORKGROUP_SIZE);
    const globalPipeline = this.globalPipeline;
    if (!globalPipeline) {
      throw new ShaderCompilationError('Global pipeline not initialized');
    }

    for (let stage = localStages; stage < numStages; stage++) {
      for (let passNum = stage; passNum >= 0; passNum--) {
        const uniformData = new Uint32Array([stage, passNum, paddedSize, 0]);
        this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(globalPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(numWorkgroups);
        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);
      }
    }

    // Wait for GPU to finish
    await this.device.queue.onSubmittedWorkDone();

    const gpuEndTime = performance.now();

    // Read back results
    const result = await this.bufferManager.readBuffer(dataBuffer, paddedSize * 4);

    // Remove padding
    const sortedData = result.slice(0, originalSize);

    // Cleanup
    this.bufferManager.releaseBuffer(dataBuffer);
    this.bufferManager.releaseBuffer(uniformBuffer);

    const totalEndTime = performance.now();

    return {
      sortedData,
      gpuTimeMs: gpuEndTime - gpuStartTime,
      totalTimeMs: totalEndTime - totalStartTime,
    };
  }

  /**
   * Release all resources
   */
  destroy(): void {
    this.bufferManager.releaseAll();
    this.localPipeline = null;
    this.globalPipeline = null;
    this.bindGroupLayout = null;
    this.initialized = false;
  }
}
