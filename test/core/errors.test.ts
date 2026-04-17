import { describe, it, expect } from 'vitest';
import {
  WebGPUNotSupportedError,
  GPUAdapterError,
  GPUDeviceError,
  BufferAllocationError,
  BufferMapError,
  ShaderCompilationError,
  GPUTimeoutError,
} from '../../src/core/errors';

describe('Error Classes', () => {
  describe('WebGPUNotSupportedError', () => {
    it('should have correct name and default message', () => {
      const error = new WebGPUNotSupportedError();
      expect(error.name).toBe('WebGPUNotSupportedError');
      expect(error.message).toBe('WebGPU is not supported in this browser');
    });

    it('should allow custom message', () => {
      const error = new WebGPUNotSupportedError('Custom message');
      expect(error.message).toBe('Custom message');
    });

    it('should be instance of Error', () => {
      const error = new WebGPUNotSupportedError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('GPUAdapterError', () => {
    it('should have correct name and default message', () => {
      const error = new GPUAdapterError();
      expect(error.name).toBe('GPUAdapterError');
      expect(error.message).toBe('Failed to get GPU adapter');
    });

    it('should allow custom message', () => {
      const error = new GPUAdapterError('No adapter available');
      expect(error.message).toBe('No adapter available');
    });

    it('should be instance of Error', () => {
      const error = new GPUAdapterError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('GPUDeviceError', () => {
    it('should have correct name and default message', () => {
      const error = new GPUDeviceError();
      expect(error.name).toBe('GPUDeviceError');
      expect(error.message).toBe('Failed to get GPU device');
    });

    it('should allow custom message', () => {
      const error = new GPUDeviceError('Device creation failed');
      expect(error.message).toBe('Device creation failed');
    });

    it('should be instance of Error', () => {
      const error = new GPUDeviceError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('BufferAllocationError', () => {
    it('should have correct name and default message', () => {
      const error = new BufferAllocationError();
      expect(error.name).toBe('BufferAllocationError');
      expect(error.message).toBe('Failed to allocate GPU buffer');
    });

    it('should allow custom message', () => {
      const error = new BufferAllocationError('Out of memory');
      expect(error.message).toBe('Out of memory');
    });

    it('should be instance of Error', () => {
      const error = new BufferAllocationError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('BufferMapError', () => {
    it('should have correct name and default message', () => {
      const error = new BufferMapError();
      expect(error.name).toBe('BufferMapError');
      expect(error.message).toBe('Failed to map GPU buffer');
    });

    it('should allow custom message', () => {
      const error = new BufferMapError('Buffer already mapped');
      expect(error.message).toBe('Buffer already mapped');
    });

    it('should be instance of Error', () => {
      const error = new BufferMapError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ShaderCompilationError', () => {
    it('should have correct name and default message', () => {
      const error = new ShaderCompilationError();
      expect(error.name).toBe('ShaderCompilationError');
      expect(error.message).toBe('Failed to compile shader');
    });

    it('should allow custom message', () => {
      const error = new ShaderCompilationError('WGSL syntax error at line 10');
      expect(error.message).toBe('WGSL syntax error at line 10');
    });

    it('should be instance of Error', () => {
      const error = new ShaderCompilationError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('GPUTimeoutError', () => {
    it('should have correct name and default message', () => {
      const error = new GPUTimeoutError();
      expect(error.name).toBe('GPUTimeoutError');
      expect(error.message).toBe('GPU operation timed out');
    });

    it('should allow custom message', () => {
      const error = new GPUTimeoutError('Operation exceeded 30s limit');
      expect(error.message).toBe('Operation exceeded 30s limit');
    });

    it('should be instance of Error', () => {
      const error = new GPUTimeoutError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Error distinguishability', () => {
    it('should be distinguishable by name property', () => {
      const errors = [
        new WebGPUNotSupportedError(),
        new GPUAdapterError(),
        new GPUDeviceError(),
        new BufferAllocationError(),
        new BufferMapError(),
        new ShaderCompilationError(),
        new GPUTimeoutError(),
      ];

      const names = errors.map((e) => e.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should be catchable as generic Error', () => {
      expect(() => {
        throw new ShaderCompilationError('test');
      }).toThrow(Error);
    });
  });
});
