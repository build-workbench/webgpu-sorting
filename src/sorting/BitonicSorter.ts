import { GPUContext } from '../core/GPUContext';
import { BufferManager } from '../core/BufferManager';
import { BufferScope } from '../core/BufferScope';
import { SortResult, SortOptions } from '../shared/types';
import { ShaderCompilationError } from '../core/errors';
import { Validator } from '../core/Validator';
import bitonicShaderCode from '../shaders/bitonic.wgsl?raw';
import { WORKGROUP_SIZE } from '../shared/constants';

/**
 * IMPORTANT: WORKGROUP_SIZE must match the value in src/shaders/bitonic.wgsl
 * @see src/shaders/bitonic.wgsl:13 - const WORKGROUP_SIZE: u32 = 256u;
 */

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

  // Preallocation state
  private preallocatedBuffer: GPUBuffer | null = null;
  private _preallocatedSize: number = 0;

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

    // For bitonic sort, we need to pad to power of 2
    const paddedSize = BitonicSorter.nextPowerOf2(maxSize);

    this.preallocatedBuffer = this.device.createBuffer({
      label: 'preallocated-bitonic-data',
      size: BufferManager.alignSize(paddedSize * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    this._preallocatedSize = maxSize;
  }

  /**
   * Release preallocated buffers. Buffers will be allocated on-demand.
   */
  clearPreallocation(): void {
    if (this.preallocatedBuffer) {
      this.preallocatedBuffer.destroy();
      this.preallocatedBuffer = null;
      this._preallocatedSize = 0;
    }
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
   * @param data - The array to sort
   * @param options - Optional sorting options
   */
  async sort(data: Uint32Array, options?: SortOptions): Promise<SortResult> {
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

    // Check if preallocated buffer can be used
    const preallocatedBuffer = this.preallocatedBuffer;
    const usePreallocated = preallocatedBuffer !== null && this._preallocatedSize >= originalSize;
    const bufferScope = new BufferScope();

    let dataBuffer: GPUBuffer;
    let sortedData: Uint32Array | undefined;
    let gpuTimeMs: number | undefined;

    try {
      if (usePreallocated) {
        this.device.queue.writeBuffer(
          preallocatedBuffer,
          0,
          paddedData.buffer,
          paddedData.byteOffset,
          paddedData.byteLength
        );
        dataBuffer = preallocatedBuffer;
      } else {
        dataBuffer = bufferScope.track(
          this.bufferManager.createStorageBuffer(paddedData, 'sort-data'),
          (buffer) => this.bufferManager.releaseBuffer(buffer)
        );
      }

      const uniformBuffer = bufferScope.track(
        this.bufferManager.createUniformBuffer(16, 'sort-uniforms'),
        (buffer) => this.bufferManager.releaseBuffer(buffer)
      );

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

      // Validate paddedSize is a valid power of 2 (defensive check)
      if (!BitonicSorter.isPowerOf2(paddedSize)) {
        throw new Error(`Invalid paddedSize: ${paddedSize} is not a power of 2`);
      }

      // Calculate number of workgroups
      const numWorkgroups = Math.ceil(paddedSize / WORKGROUP_SIZE);
      // Safe integer log2 - paddedSize is guaranteed to be power of 2
      const numStages = Math.trunc(Math.log2(paddedSize));
      // Safe integer log2 - WORKGROUP_SIZE is guaranteed to be power of 2
      const localStages = Math.trunc(Math.log2(WORKGROUP_SIZE));

      const localPipeline = this.localPipeline;
      const globalPipeline = this.globalPipeline;
      if (!localPipeline || !globalPipeline) {
        throw new ShaderCompilationError('Sort pipelines not initialized');
      }

      // Pre-compute all uniform values (local pass + all global passes) into a
      // single buffer, then batch every dispatch into one command encoder with
      // copyBufferToBuffer updating the uniform between passes. This eliminates
      // per-pass queue submissions (can be 100+ for large arrays).
      const passes: Array<{ stage: number; passNum: number; isLocal: boolean }> = [
        { stage: 0, passNum: 0, isLocal: true },
      ];
      for (let stage = localStages; stage < numStages; stage++) {
        for (let passNum = stage; passNum >= 0; passNum--) {
          passes.push({ stage, passNum, isLocal: false });
        }
      }

      const uniformData = new Uint32Array(passes.length * 4);
      for (let i = 0; i < passes.length; i++) {
        const p = passes[i];
        uniformData[i * 4] = p.stage;
        uniformData[i * 4 + 1] = p.passNum;
        uniformData[i * 4 + 2] = paddedSize;
        uniformData[i * 4 + 3] = 0;
      }

      const uniformDataBuffer = bufferScope.track(
        this.device.createBuffer({
          label: 'bitonic-uniform-data',
          size: BufferManager.alignSize(uniformData.byteLength, 4),
          usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        })
      );
      this.device.queue.writeBuffer(uniformDataBuffer, 0, uniformData);

      // Single command encoder for all passes — compute passes within an
      // encoder are ordered and each sees the writes of previous passes.
      const commandEncoder = this.device.createCommandEncoder();
      for (let i = 0; i < passes.length; i++) {
        // Update uniform for this pass via encoder-level copy (ordered)
        commandEncoder.copyBufferToBuffer(uniformDataBuffer, i * 16, uniformBuffer, 0, 16);

        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(passes[i].isLocal ? localPipeline : globalPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(numWorkgroups);
        passEncoder.end();
      }
      this.device.queue.submit([commandEncoder.finish()]);

      // Wait for GPU to finish
      await this.device.queue.onSubmittedWorkDone();

      const gpuEndTime = performance.now();

      // Read back results
      const result = await this.bufferManager.readBuffer(dataBuffer, paddedSize * 4);

      // Remove padding
      sortedData = result.slice(0, originalSize);
      gpuTimeMs = gpuEndTime - gpuStartTime;
    } finally {
      bufferScope.releaseAll();
    }

    if (!sortedData) {
      throw new Error('Bitonic sort completed without producing output');
    }
    if (gpuTimeMs === undefined) {
      throw new Error('Bitonic sort completed without timing information');
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
    this.localPipeline = null;
    this.globalPipeline = null;
    this.bindGroupLayout = null;
    this.initialized = false;
  }
}
