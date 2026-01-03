import { BufferAllocationError, BufferMapError } from './errors';

/**
 * Manages GPU buffer creation, data transfer, and lifecycle
 */
export class BufferManager {
  private device: GPUDevice;
  private buffers: Set<GPUBuffer> = new Set();

  constructor(device: GPUDevice) {
    this.device = device;
  }

  /**
   * Calculate aligned buffer size
   * WebGPU requires buffer sizes to be aligned to certain boundaries
   */
  static alignSize(size: number, alignment: number): number {
    if (alignment <= 0) {
      throw new Error('Alignment must be positive');
    }
    return Math.ceil(size / alignment) * alignment;
  }

  /**
   * Create a storage buffer and upload data
   */
  createStorageBuffer(data: Uint32Array, label?: string): GPUBuffer {
    const byteSize = BufferManager.alignSize(data.byteLength, 4);
    
    try {
      const buffer = this.device.createBuffer({
        label: label ?? 'storage-buffer',
        size: byteSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });

      // Copy data to buffer
      const mappedRange = new Uint32Array(buffer.getMappedRange());
      mappedRange.set(data);
      buffer.unmap();

      this.buffers.add(buffer);
      return buffer;
    } catch (e) {
      throw new BufferAllocationError(`Failed to create storage buffer: ${e}`);
    }
  }

  /**
   * Create a staging buffer for reading data back to CPU
   */
  createStagingBuffer(size: number): GPUBuffer {
    const alignedSize = BufferManager.alignSize(size, 4);
    
    try {
      const buffer = this.device.createBuffer({
        label: 'staging-buffer',
        size: alignedSize,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      this.buffers.add(buffer);
      return buffer;
    } catch (e) {
      throw new BufferAllocationError(`Failed to create staging buffer: ${e}`);
    }
  }

  /**
   * Create a uniform buffer
   */
  createUniformBuffer(size: number, label?: string): GPUBuffer {
    const alignedSize = BufferManager.alignSize(size, 16); // Uniforms need 16-byte alignment
    
    try {
      const buffer = this.device.createBuffer({
        label: label ?? 'uniform-buffer',
        size: alignedSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.buffers.add(buffer);
      return buffer;
    } catch (e) {
      throw new BufferAllocationError(`Failed to create uniform buffer: ${e}`);
    }
  }

  /**
   * Read data from a GPU buffer back to CPU
   */
  async readBuffer(sourceBuffer: GPUBuffer, size: number): Promise<Uint32Array> {
    const alignedSize = BufferManager.alignSize(size, 4);
    const stagingBuffer = this.createStagingBuffer(alignedSize);

    // Copy from source to staging
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(sourceBuffer, 0, stagingBuffer, 0, alignedSize);
    this.device.queue.submit([commandEncoder.finish()]);

    // Map and read
    try {
      await stagingBuffer.mapAsync(GPUMapMode.READ);
      const mappedRange = stagingBuffer.getMappedRange();
      const result = new Uint32Array(mappedRange.slice(0, size));
      stagingBuffer.unmap();
      
      // Clean up staging buffer
      this.releaseBuffer(stagingBuffer);
      
      return result;
    } catch (e) {
      this.releaseBuffer(stagingBuffer);
      throw new BufferMapError(`Failed to read buffer: ${e}`);
    }
  }

  /**
   * Write data to an existing buffer
   */
  writeBuffer(buffer: GPUBuffer, data: Uint32Array, offset = 0): void {
    this.device.queue.writeBuffer(buffer, offset, data.buffer, data.byteOffset, data.byteLength);
  }

  /**
   * Release a specific buffer
   */
  releaseBuffer(buffer: GPUBuffer): void {
    if (this.buffers.has(buffer)) {
      buffer.destroy();
      this.buffers.delete(buffer);
    }
  }

  /**
   * Release all managed buffers
   */
  releaseAll(): void {
    for (const buffer of this.buffers) {
      buffer.destroy();
    }
    this.buffers.clear();
  }

  /**
   * Get the number of managed buffers
   */
  getBufferCount(): number {
    return this.buffers.size;
  }
}
