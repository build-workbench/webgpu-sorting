# Product Spec: Infrastructure

## Introduction

This spec defines the core infrastructure components for the WebGPU Sorting project: GPUContext, BufferManager, Validator, and error handling utilities. These components provide the foundation for GPU compute operations.

## Glossary

- **GPUContext**: Manages WebGPU adapter and device initialization
- **BufferManager**: Handles GPU buffer creation, data transfer, and lifecycle
- **Validator**: Verifies sorting correctness and array equality
- **Error Classes**: Custom error types for specific GPU-related failures
- **Timeout Utility**: Wraps GPU operations with configurable timeouts

## Requirements

### Requirement 1: GPU Context Initialization

**User Story:** As a developer, I want to initialize the WebGPU environment with proper device limits and error handling.

#### Acceptance Criteria

1. WHEN `initialize()` is called, THE GPUContext SHALL request a GPU adapter with high-performance preference
2. IF WebGPU is not supported, THE GPUContext SHALL throw `WebGPUNotSupportedError`
3. IF no adapter is available, THE GPUContext SHALL throw `GPUAdapterError`
4. IF device request fails, THE GPUContext SHALL throw `GPUDeviceError`
5. THE GPUContext SHALL query adapter limits and request reasonable device limits
6. THE GPUContext SHALL store limits info for downstream use
7. THE GPUContext SHALL handle device loss events gracefully with callbacks

### Requirement 2: GPU Buffer Management

**User Story:** As a developer, I want to create and manage GPU buffers for sorting operations.

#### Acceptance Criteria

1. WHEN `createStorageBuffer()` is called, THE BufferManager SHALL create a mapped buffer and upload data
2. WHEN `createUniformBuffer()` is called, THE BufferManager SHALL create a buffer with 16-byte alignment
3. WHEN `createStagingBuffer()` is called, THE BufferManager SHALL create a MAP_READ buffer for CPU readback
4. WHEN `readBuffer()` is called, THE BufferManager SHALL copy GPU data to staging buffer and map it for reading
5. IF buffer creation fails, THE BufferManager SHALL throw `BufferAllocationError` with formatted message
6. IF buffer mapping fails, THE BufferManager SHALL throw `BufferMapError` with formatted message
7. THE BufferManager SHALL track all buffers for proper cleanup

### Requirement 3: Sorting Validation

**User Story:** As a developer, I want to verify that GPU sorting results are correct.

#### Acceptance Criteria

1. THE Validator SHALL verify arrays are sorted in ascending order
2. THE Validator SHALL verify sorted arrays contain the same elements as input
3. THE Validator SHALL support maximum validation size to prevent memory issues
4. FOR arrays exceeding max size, THE Validator SHALL sample validate instead of full validation
5. THE Validator SHALL return detailed validation results with error messages

### Requirement 4: Error Handling

**User Story:** As a developer, I want specific error types for different GPU failures.

#### Acceptance Criteria

1. THE library SHALL provide `WebGPUNotSupportedError` for browser compatibility issues
2. THE library SHALL provide `GPUAdapterError` for adapter request failures
3. THE library SHALL provide `GPUDeviceError` for device request failures
4. THE library SHALL provide `BufferAllocationError` for buffer creation failures
5. THE library SHALL provide `BufferMapError` for buffer mapping failures
6. THE library SHALL provide `ShaderCompilationError` for shader compilation failures
7. THE library SHALL provide `GPUTimeoutError` for operation timeouts

### Requirement 5: GPU Operation Timeout

**User Story:** As a developer, I want to wrap GPU operations with configurable timeouts.

#### Acceptance Criteria

1. THE `withTimeout()` function SHALL accept a promise and timeout options
2. THE default timeout SHALL be 30000 milliseconds
3. IF the operation exceeds the timeout, THE function SHALL throw `GPUTimeoutError`
4. THE function SHALL clean up the timeout timer on success or failure
5. THE `createTimeoutWrapper()` function SHALL create a reusable timeout wrapper with default options

### Requirement 6: Resource Lifecycle

**User Story:** As a developer, I want to properly release GPU resources when done.

#### Acceptance Criteria

1. THE GPUContext SHALL provide `destroy()` method to release device and adapter
2. THE BufferManager SHALL provide `releaseBuffer()` to release individual buffers
3. THE BufferManager SHALL provide `releaseAll()` to release all managed buffers
4. THE Sorter classes SHALL provide `destroy()` to release pipelines and buffers
5. WHEN `destroy()` is called, THE resources SHALL be properly cleaned up and nulled
