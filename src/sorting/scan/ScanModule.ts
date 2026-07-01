/**
 * ScanModule - GPU-based exclusive prefix sum (Blelloch scan)
 *
 * This module provides a dedicated scan interface for computing
 * exclusive prefix sums on the GPU using the Blelloch algorithm.
 *
 * Architecture:
 * - Three dedicated bind group layouts (one per pipeline) to avoid
 *   read-only/read-write binding hazards on the same buffer.
 * - Recursive multi-level scan for arbitrarily large inputs: block sums
 *   are scanned recursively until they fit in a single workgroup.
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
/** Maximum block sums a single scan_block_sums workgroup can process */
const MAX_LEAF_BLOCK_SUMS = ELEMENTS_PER_SCAN_BLOCK; // 512

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

  // Dedicated bind group layouts per pipeline (avoids binding hazards)
  private scanLayout: GPUBindGroupLayout | null = null; // bindings 0,1,2,3
  private blockSumsScanLayout: GPUBindGroupLayout | null = null; // bindings 2,3
  private addPrefixesLayout: GPUBindGroupLayout | null = null; // bindings 1,2,3

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

    // Layout for blelloch_scan: input(0, read), output(1, rw), blockSums(2, rw), uniforms(3)
    this.scanLayout = this.device.createBindGroupLayout({
      label: 'scan-layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    // Layout for scan_block_sums: blockSums(2, rw), uniforms(3)
    this.blockSumsScanLayout = this.device.createBindGroupLayout({
      label: 'block-sums-scan-layout',
      entries: [
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    // Layout for add_block_prefixes: output(1, rw), blockSums(2, rw), uniforms(3)
    this.addPrefixesLayout = this.device.createBindGroupLayout({
      label: 'add-prefixes-layout',
      entries: [
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    this.blellochScanPipeline = this.device.createComputePipeline({
      label: 'blelloch-scan-pipeline',
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.scanLayout] }),
      compute: { module: shaderModule, entryPoint: 'blelloch_scan' },
    });

    this.scanBlockSumsPipeline = this.device.createComputePipeline({
      label: 'scan-block-sums-pipeline',
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.blockSumsScanLayout] }),
      compute: { module: shaderModule, entryPoint: 'scan_block_sums' },
    });

    this.addBlockPrefixesPipeline = this.device.createComputePipeline({
      label: 'add-block-prefixes-pipeline',
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.addPrefixesLayout] }),
      compute: { module: shaderModule, entryPoint: 'add_block_prefixes' },
    });

    this.initialized = true;
  }

  /**
   * Compute exclusive prefix sum on GPU using Blelloch scan
   *
   * Uses a recursive multi-level scan for large arrays:
   * 1. Local scan within each workgroup (512 elements each)
   * 2. Recursive exclusive prefix sum of block sums
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

    if (dataSize === 0) {
      return new Uint32Array(0);
    }

    if (dataSize === 1) {
      return new Uint32Array([0]);
    }

    const numScanBlocks = Math.ceil(dataSize / ELEMENTS_PER_SCAN_BLOCK);
    const bufferScope = new BufferScope();

    try {
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

      this.computePrefixSumGPU(inputBuffer, outputBuffer, blockSumsBuffer, uniformBuffer, dataSize);

      await this.device.queue.onSubmittedWorkDone();

      const result = await this.bufferManager.readBuffer(outputBuffer, dataSize * 4);

      return result;
    } finally {
      bufferScope.releaseAll();
    }
  }

  /**
   * Internal method to compute prefix sum on GPU.
   *
   * This is exposed for use by RadixSorter which already has buffers allocated.
   * Commands are queued synchronously; the caller is responsible for waiting
   * on `device.queue.onSubmittedWorkDone()` before reading results.
   */
  computePrefixSumGPU(
    inputBuffer: GPUBuffer,
    outputBuffer: GPUBuffer,
    blockSumsBuffer: GPUBuffer,
    uniformBuffer: GPUBuffer,
    dataSize: number
  ): void {
    const scanLayout = this.scanLayout;
    const blellochPipeline = this.blellochScanPipeline;
    const addBlockPrefixesPipeline = this.addBlockPrefixesPipeline;
    const addPrefixesLayout = this.addPrefixesLayout;

    if (!scanLayout || !blellochPipeline || !addBlockPrefixesPipeline || !addPrefixesLayout) {
      throw new ShaderCompilationError('Scan pipelines not initialized');
    }

    const numScanBlocks = Math.ceil(dataSize / ELEMENTS_PER_SCAN_BLOCK);

    // Uniform: [data_size, num_blocks, 0, 0]
    // - blelloch_scan uses both data_size and num_blocks
    // - scan_block_sums uses num_blocks (as element count)
    // - add_block_prefixes uses data_size (for bounds check)
    this.writeUniform(uniformBuffer, dataSize, numScanBlocks);

    // Step 1: Local Blelloch scan within each workgroup
    {
      const bindGroup = this.device.createBindGroup({
        label: 'blelloch-scan-bind-group',
        layout: scanLayout,
        entries: [
          { binding: 0, resource: { buffer: inputBuffer } },
          { binding: 1, resource: { buffer: outputBuffer } },
          { binding: 2, resource: { buffer: blockSumsBuffer } },
          { binding: 3, resource: { buffer: uniformBuffer } },
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

    // Step 2 + 3: Scan block sums and add prefixes (if more than one block)
    if (numScanBlocks > 1) {
      this.scanBlockSumsRecursive(blockSumsBuffer, numScanBlocks, uniformBuffer);

      // Re-write uniform (recursion may have overwritten it) for add_block_prefixes
      this.writeUniform(uniformBuffer, dataSize, numScanBlocks);

      {
        const bindGroup = this.device.createBindGroup({
          label: 'add-block-prefixes-bind-group',
          layout: addPrefixesLayout,
          entries: [
            { binding: 1, resource: { buffer: outputBuffer } },
            { binding: 2, resource: { buffer: blockSumsBuffer } },
            { binding: 3, resource: { buffer: uniformBuffer } },
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
   * Recursively compute exclusive prefix sum on the block sums buffer in-place.
   *
   * - If count <= MAX_LEAF_BLOCK_SUMS (512): single-workgroup in-place scan.
   * - Otherwise: split into sub-blocks, scan recursively, add prefixes, copy back.
   *
   * Temp buffers are allocated and destroyed within this method. Per the WebGPU
   * spec, destroying a buffer after submitting commands that reference it is
   * safe — the GPU retains the memory until queued work completes.
   */
  private scanBlockSumsRecursive(buffer: GPUBuffer, count: number, uniformBuffer: GPUBuffer): void {
    const scanBlockSumsPipeline = this.scanBlockSumsPipeline;
    const scanLayout = this.scanLayout;
    const addBlockPrefixesPipeline = this.addBlockPrefixesPipeline;
    const blockSumsScanLayout = this.blockSumsScanLayout;
    const addPrefixesLayout = this.addPrefixesLayout;
    const blellochScanPipeline = this.blellochScanPipeline;

    if (
      !scanBlockSumsPipeline ||
      !scanLayout ||
      !addBlockPrefixesPipeline ||
      !blockSumsScanLayout ||
      !addPrefixesLayout ||
      !blellochScanPipeline
    ) {
      throw new ShaderCompilationError('Scan pipelines not initialized');
    }

    // Leaf case: single workgroup can handle all block sums in-place
    if (count <= MAX_LEAF_BLOCK_SUMS) {
      // scan_block_sums uses num_blocks as the element count
      this.writeUniform(uniformBuffer, count, count);

      const bindGroup = this.device.createBindGroup({
        label: 'scan-block-sums-bind-group',
        layout: blockSumsScanLayout,
        entries: [
          { binding: 2, resource: { buffer } },
          { binding: 3, resource: { buffer: uniformBuffer } },
        ],
      });

      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(scanBlockSumsPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(1);
      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);
      return;
    }

    // Recursive case: split into sub-blocks
    const numSubBlocks = Math.ceil(count / ELEMENTS_PER_SCAN_BLOCK);

    const tempOutput = this.device.createBuffer({
      label: 'scan-recursive-temp-output',
      size: BufferManager.alignSize(count * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const tempBlockSums = this.device.createBuffer({
      label: 'scan-recursive-temp-block-sums',
      size: BufferManager.alignSize(numSubBlocks * 4, 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Sub-step 1: local scan of block sums into tempOutput
    this.writeUniform(uniformBuffer, count, numSubBlocks);

    {
      const bindGroup = this.device.createBindGroup({
        label: 'recursive-blelloch-scan-bind-group',
        layout: scanLayout,
        entries: [
          { binding: 0, resource: { buffer } },
          { binding: 1, resource: { buffer: tempOutput } },
          { binding: 2, resource: { buffer: tempBlockSums } },
          { binding: 3, resource: { buffer: uniformBuffer } },
        ],
      });

      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(blellochScanPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(numSubBlocks);
      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);
    }

    // Sub-step 2: recursively scan the sub-block sums
    this.scanBlockSumsRecursive(tempBlockSums, numSubBlocks, uniformBuffer);

    // Sub-step 3: add sub-block prefixes to tempOutput
    this.writeUniform(uniformBuffer, count, numSubBlocks);

    {
      const bindGroup = this.device.createBindGroup({
        label: 'recursive-add-prefixes-bind-group',
        layout: addPrefixesLayout,
        entries: [
          { binding: 1, resource: { buffer: tempOutput } },
          { binding: 2, resource: { buffer: tempBlockSums } },
          { binding: 3, resource: { buffer: uniformBuffer } },
        ],
      });

      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(addBlockPrefixesPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(numSubBlocks);
      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);
    }

    // Sub-step 4: copy scanned result back into the original buffer
    {
      const commandEncoder = this.device.createCommandEncoder();
      commandEncoder.copyBufferToBuffer(
        tempOutput,
        0,
        buffer,
        0,
        BufferManager.alignSize(count * 4, 4)
      );
      this.device.queue.submit([commandEncoder.finish()]);
    }

    // Release temp buffers (safe after submit per WebGPU spec)
    tempOutput.destroy();
    tempBlockSums.destroy();
  }

  /**
   * Write scan uniform data [dataSize, numBlocks, 0, 0]
   */
  private writeUniform(uniformBuffer: GPUBuffer, dataSize: number, numBlocks: number): void {
    const data = new Uint32Array([dataSize, numBlocks, 0, 0]);
    this.device.queue.writeBuffer(uniformBuffer, 0, data);
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
    this.scanLayout = null;
    this.blockSumsScanLayout = null;
    this.addPrefixesLayout = null;
    this.initialized = false;
  }
}
