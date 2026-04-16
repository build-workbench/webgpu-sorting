# Requirements Document

## Introduction

本项目实现基于 WebGPU 的高性能 GPU 排序算法，包括双调排序（Bitonic Sort）和基数排序（Radix Sort）。目标是展示 GPU 通用计算能力，实现比 JavaScript 原生 `Array.sort()` 快数十倍的排序性能。项目重点展示工作组同步屏障、并行归约等 GPU 编程核心技术。

## Glossary

- **WebGPU**: 新一代 Web 图形和计算 API，提供对现代 GPU 的低级访问
- **Bitonic_Sort**: 双调排序，一种适合并行实现的比较排序算法
- **Radix_Sort**: 基数排序，一种非比较排序算法，按位进行排序
- **Compute_Shader**: 计算着色器，用于通用 GPU 计算的程序
- **Workgroup**: 工作组，一组可以共享内存和同步的 GPU 线程
- **Workgroup_Barrier**: 工作组屏障，用于同步工作组内所有线程的同步原语
- **Shared_Memory**: 共享内存，工作组内线程可访问的快速本地内存
- **Parallel_Reduction**: 并行归约，将数组元素通过并行操作合并为单个值的技术
- **GPU_Buffer**: GPU 缓冲区，存储在 GPU 内存中的数据容器
- **Dispatch**: 调度，启动 GPU 计算任务的操作

## Requirements

### Requirement 1: WebGPU 环境初始化

**User Story:** 作为开发者，我希望能够初始化 WebGPU 环境，以便在浏览器中执行 GPU 计算任务。

#### Acceptance Criteria

1. WHEN the application starts, THE Initializer SHALL request a GPU adapter and device
2. IF WebGPU is not supported, THEN THE Initializer SHALL return a descriptive error message
3. WHEN the GPU device is obtained, THE Initializer SHALL create necessary command encoders and queues
4. THE Initializer SHALL verify compute shader support before proceeding

### Requirement 2: GPU 缓冲区管理

**User Story:** 作为开发者，我希望能够在 CPU 和 GPU 之间高效传输数据，以便进行排序计算。

#### Acceptance Criteria

1. WHEN input data is provided, THE Buffer_Manager SHALL create appropriate GPU storage buffers
2. THE Buffer_Manager SHALL support uploading unsigned 32-bit integer arrays to GPU memory
3. THE Buffer_Manager SHALL support downloading sorted results from GPU to CPU memory
4. WHEN buffers are no longer needed, THE Buffer_Manager SHALL properly release GPU resources
5. THE Buffer_Manager SHALL handle buffer size alignment requirements for WebGPU

### Requirement 3: 双调排序实现

**User Story:** 作为开发者，我希望实现双调排序算法的 GPU 版本，以便高效地对大规模数据进行排序。

#### Acceptance Criteria

1. THE Bitonic_Sorter SHALL implement the bitonic merge network in WGSL compute shaders
2. WHEN sorting, THE Bitonic_Sorter SHALL use workgroupBarrier() for thread synchronization within workgroups
3. THE Bitonic_Sorter SHALL utilize shared memory for intra-workgroup data exchange
4. WHEN the input size is not a power of 2, THE Bitonic_Sorter SHALL pad the array appropriately
5. FOR ALL valid input arrays, THE Bitonic_Sorter SHALL produce a correctly sorted output in ascending order
6. THE Bitonic_Sorter SHALL support sorting arrays of at least 1 million unsigned 32-bit integers

### Requirement 4: 基数排序实现

**User Story:** 作为开发者，我希望实现基数排序算法的 GPU 版本，以便对整数数据进行高效的非比较排序。

#### Acceptance Criteria

1. THE Radix_Sorter SHALL implement per-digit sorting using WGSL compute shaders
2. THE Radix_Sorter SHALL compute prefix sum on CPU for digit offsets (simplified approach)
3. WHEN processing each radix pass, THE Radix_Sorter SHALL use workgroupBarrier() for synchronization
4. THE Radix_Sorter SHALL implement parallel reduction for histogram computation
5. FOR ALL valid input arrays, THE Radix_Sorter SHALL produce a correctly sorted output in ascending order
6. THE Radix_Sorter SHALL support sorting arrays of at least 1 million unsigned 32-bit integers

### Requirement 5: 性能基准测试

**User Story:** 作为开发者，我希望能够对比 GPU 排序与 CPU 排序的性能，以便验证 GPU 加速的效果。

#### Acceptance Criteria

1. THE Benchmark SHALL measure sorting time for both GPU algorithms and JavaScript Array.sort()
2. THE Benchmark SHALL test multiple array sizes (1K, 10K, 100K, 1M elements)
3. THE Benchmark SHALL report speedup ratio comparing GPU to CPU performance
4. THE Benchmark SHALL exclude data transfer time in GPU-only timing measurements
5. THE Benchmark SHALL include total time (with data transfer) for realistic comparison
6. WHEN benchmarking, THE Benchmark SHALL run multiple iterations and report average times

### Requirement 6: 排序正确性验证

**User Story:** 作为开发者，我希望能够验证 GPU 排序结果的正确性，以确保算法实现无误。

#### Acceptance Criteria

1. THE Validator SHALL verify that output arrays are in ascending order
2. THE Validator SHALL verify that output arrays contain the same elements as input arrays
3. THE Validator SHALL support comparing GPU results against JavaScript Array.sort() results
4. FOR ALL test cases, THE Validator SHALL report any discrepancies found

### Requirement 7: 演示界面

**User Story:** 作为用户，我希望有一个简单的界面来运行排序演示和查看性能结果。

#### Acceptance Criteria

1. THE Demo_UI SHALL provide controls to select array size and sorting algorithm
2. THE Demo_UI SHALL display sorting progress and completion status
3. THE Demo_UI SHALL show performance metrics including execution time and speedup ratio
4. THE Demo_UI SHALL handle and display errors gracefully
5. WHEN WebGPU is not available, THE Demo_UI SHALL display a clear unsupported message
