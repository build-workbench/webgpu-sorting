/**
 * Custom error classes for WebGPU sorting operations
 */

export class WebGPUNotSupportedError extends Error {
  constructor(message = 'WebGPU is not supported in this browser') {
    super(message);
    this.name = 'WebGPUNotSupportedError';
  }
}

export class GPUAdapterError extends Error {
  constructor(message = 'Failed to get GPU adapter') {
    super(message);
    this.name = 'GPUAdapterError';
  }
}

export class GPUDeviceError extends Error {
  constructor(message = 'Failed to get GPU device') {
    super(message);
    this.name = 'GPUDeviceError';
  }
}

export class BufferAllocationError extends Error {
  constructor(message = 'Failed to allocate GPU buffer') {
    super(message);
    this.name = 'BufferAllocationError';
  }
}

export class BufferMapError extends Error {
  constructor(message = 'Failed to map GPU buffer') {
    super(message);
    this.name = 'BufferMapError';
  }
}

export class ShaderCompilationError extends Error {
  constructor(message = 'Failed to compile shader') {
    super(message);
    this.name = 'ShaderCompilationError';
  }
}

export class GPUTimeoutError extends Error {
  constructor(message = 'GPU operation timed out') {
    super(message);
    this.name = 'GPUTimeoutError';
  }
}
