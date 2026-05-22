/**
 * Tracks temporary GPU buffers for a single operation and releases them once.
 */
export class BufferScope {
  private releasers = new Map<GPUBuffer, () => void>();

  /**
   * Track a buffer with an optional custom release strategy.
   */
  track<T extends GPUBuffer>(buffer: T, release?: (buffer: T) => void): T {
    this.releasers.set(buffer, () => {
      if (release) {
        release(buffer);
        return;
      }
      buffer.destroy();
    });

    return buffer;
  }

  /**
   * Stop tracking a buffer so later releaseAll() calls leave it alone.
   */
  untrack(buffer: GPUBuffer): void {
    this.releasers.delete(buffer);
  }

  /**
   * Release every tracked buffer exactly once.
   */
  releaseAll(): void {
    for (const release of this.releasers.values()) {
      release();
    }
    this.releasers.clear();
  }
}
