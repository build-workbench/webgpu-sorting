# Sorting Domain

Core sorting algorithms and performance requirements for the WebGPU Sorting library.

> 排序域 - WebGPU 排序库的核心排序算法与性能需求。

## Specifications

| Spec                                     | Description                       | 说明             |
| ---------------------------------------- | --------------------------------- | ---------------- |
| [webgpu-sorting.md](./webgpu-sorting.md) | Core sorting feature requirements | 核心排序功能需求 |

## Components

- **BitonicSorter** - Bitonic sort implementation (O(n log²n))
- **RadixSorter** - Radix sort implementation (O(n × k))
- **Benchmark** - Performance benchmarking utilities
- **Validator** - Sorting result validation

## Related Domains

- [../infrastructure/](../infrastructure/) - WebGPU context and buffer management
- [../quality/](../quality/) - CI/CD and code quality standards
