/**
 * ScanModule - GPU-based exclusive prefix sum (Blelloch scan)
 *
 * This module provides a dedicated scan interface for computing
 * exclusive prefix sums on the GPU using the Blelloch algorithm.
 */

import { GPUContext } from '../../core/GPUContext';
import { BufferManager } from '../../core/BufferManager';
import { BufferScope } from '../../core/BufferScope';
import { ShaderCompilationError } from '../../core/errors';
import scanShaderCode from '../../shaders/scan.wgsl?raw';

/** Size for Blelloch scan workgroups */
const SCAN_WORKGROUP_SIZE = 256;
/** Elements processed per scan workgroup (each thread handles 2 elements) */
const ELEMENTS_PER_SCAN_BLOCK = SCAN_WORKGROUP_SIZE * 2;

/**
 * GPU-based exclusive prefix sum module using Blelloch scan
 */
export class ScanModule {
  private device: GPUDevice;
  private bufferManager: BufferManager;

  // Scan pipelines
  private blellochScanPipeline: GPUComputePipeline | null = null;
  private scanBlockSumsPipeline: GPUComputePipeline | null = null;
  private addBlockPrefixesPipeline: GPUComputePipeline | null = null;
  private scanBindGroupLayout: GPUBindGroupLayout | null = null;

  private initialized = false;

  constructor(context: GPUContext) {
    this.device = context.getDevice();
    this.bufferManager = new BufferManager(this.device);
  }

  /**
   * Initialize scan pipelines
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const shaderModule = this.device.createShaderModule({
      label: 'scan-shader',
      code: scanShaderCode,
    });

    const compilationInfo = await shaderModule.getCompilationInfo();
    const errors = compilationInfo.messages.filter((m) => m.type === 'error');
    if (errors.length > 0) {
      throw new ShaderCompilationError(
        `Scan shader compilation failed: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    // Create scan bind group layout
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
   *
   * Uses a two-level scan for large arrays:
   * 1. Local scan within each workgroup
   * 2. Scan of block sums
   * 3. Add block prefixes to local results
   *
   * @param input - Input array to compute prefix sum for
   * @returns Exclusive prefix sum of input
   */
  async computeExclusivePrefixSum(input: Uint32Array): Promise<Uint32Array> {
    if (!this.initialized) {
      throw new ShaderCompilationError('ScanModule not initialized. Call initialize() first.');
    }

    const dataSize = input.length;

    // Handle edge cases
    if (dataSize === 0) {
      return new Uint32Array(0);
    }

    if (dataSize === 1) {
      return new Uint32Array([0]);
    }

    const numScanBlocks = Math.ceil(dataSize / ELEMENTS_PER_SCAN_BLOCK);
    const bufferScope = new BufferScope();

    try {
      // Create buffers
      const inputBuffer = bufferScope.track(
        this.bufferManager.createStorageBuffer(input, 'scan-input'),
        (buffer) => this.bufferManager.releaseBuffer(buffer)
      );

      const outputBuffer = bufferScope.track(
        this.device.createBuffer({
          label: 'scan-output',
          size: BufferManager.alignSize(dataSize * 4, 4),
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        })
      );

      const blockSumsBuffer = bufferScope.track(
        this.device.createBuffer({
          label: 'scan-block-sums',
          size: BufferManager.alignSize(numScanBlocks * 4, 4),
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        })
      );

      const uniformBuffer = bufferScope.track(
        this.bufferManager.createUniformBuffer(16, 'scan-uniforms'),
        (buffer) => this.bufferManager.releaseBuffer(buffer)
      );

      // Perform the scan
      this.computePrefixSumGPU(inputBuffer, outputBuffer, blockSumsBuffer, uniformBuffer, dataSize);

      // Wait for GPU to finish
      await this.device.queue.onSubmittedWorkDone();

      // Read results
      const result = await this.bufferManager.readBuffer(outputBuffer, dataSize * 4);

      return result;
    } finally {
      bufferScope.releaseAll();
    }
  }

  /**
   * Internal method to compute prefix sum on GPU
   *
   * This is exposed for use by RadixSorter which already has buffers allocated.
   */
  computePrefixSumGPU(
    inputBuffer: GPUBuffer,
    outputBuffer: GPUBuffer,
    blockSumsBuffer: GPUBuffer,
    uniformBuffer: GPUBuffer,
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
    this.device.queue.writeBuffer(uniformBuffer, 0, scanUniformData);

    // Use a single command encoder for all dispatches to ensure proper ordering
    const commandEncoder = this.device.createCommandEncoder();

    // Step 1: Local Blelloch scan within each workgroup
    {
      const bindGroup = this.device.createBindGroup({
        label: 'blelloch-scan-bind-group',
        layout: scanBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: inputBuffer } },
          { binding: 1, resource: { buffer: outputBuffer } },
          { binding: 2, resource: { buffer: blockSumsBuffer } },
          { binding: 3, resource: { buffer: uniformBuffer } },
        ],
      });

      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(blellochPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(numScanBlocks);
      passEncoder.end();
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
          { binding: 3, resource: { buffer: uniformBuffer } },
        ],
      });

      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(scanBlockSumsPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(1);
      passEncoder.end();

      // Step 3: Add block prefixes to each block's local results
      {
        const bindGroup = this.device.createBindGroup({
          label: 'add-block-prefixes-bind-group',
          layout: scanBindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: inputBuffer } },
            { binding: 1, resource: { buffer: outputBuffer } },
            { binding: 2, resource: { buffer: blockSumsBuffer } },
            { binding: 3, resource: { buffer: uniformBuffer } },
          ],
        });

        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(addBlockPrefixesPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(numScanBlocks);
        passEncoder.end();
      }
    }

    // Submit all commands together
    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * Get the scan bind group layout for external use
   */
  getBindGroupLayout(): GPUBindGroupLayout | null {
    return this.scanBindGroupLayout;
  }

  /**
   * Get the scan pipelines for external use
   */
  getPipelines(): {
    blellochScan: GPUComputePipeline | null;
    scanBlockSums: GPUComputePipeline | null;
    addBlockPrefixes: GPUComputePipeline | null;
  } {
    return {
      blellochScan: this.blellochScanPipeline,
      scanBlockSums: this.scanBlockSumsPipeline,
      addBlockPrefixes: this.addBlockPrefixesPipeline,
    };
  }

  /**
   * Get constants for external use
   */
  static getConstants(): {
    scanWorkgroupSize: number;
    elementsPerScanBlock: number;
  } {
    return {
      scanWorkgroupSize: SCAN_WORKGROUP_SIZE,
      elementsPerScanBlock: ELEMENTS_PER_SCAN_BLOCK,
    };
  }

  /**
   * Release all resources
   */
  destroy(): void {
    this.bufferManager.releaseAll();
    this.blellochScanPipeline = null;
    this.scanBlockSumsPipeline = null;
    this.addBlockPrefixesPipeline = null;
    this.scanBindGroupLayout = null;
    this.initialized = false;
  }
}
