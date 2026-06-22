# Performance Benchmarks

This project does not treat any single benchmark table as universal truth. WebGPU performance depends heavily on browser version, driver quality, GPU architecture, array size, and whether you can reuse buffers across runs.

## How to evaluate performance

Use the [interactive demo](/demo) to test the current build on your own machine. Compare:

1. **GPU time** - compute work only
2. **Total time** - upload, compute, and readback together
3. **CPU time** - `TypedArray.sort()` as a local baseline

## What usually matters most

### Input size

Small arrays often stay CPU-favorable because buffer transfer overhead dominates. Larger arrays are where GPU sorting becomes interesting.

### Reuse

Repeated sorts get better when you reuse the same `GPUContext` and keep buffers alive between runs.

### Algorithm choice

| Use case                         | Better starting point | Why                                            |
| -------------------------------- | --------------------- | ---------------------------------------------- |
| General reference implementation | `BitonicSorter`       | Predictable structure and simpler reasoning    |
| Large `Uint32Array` workloads    | `RadixSorter`         | Fewer wasted comparisons on integer-heavy data |
| Small or one-off arrays          | CPU sort              | Lower setup cost                               |

## Benchmark workflow

1. Start with a small array and confirm correctness.
2. Increase array size until transfer overhead stops dominating.
3. Compare GPU-only time with total time; both matter.
4. Repeat the same run several times to smooth out shader compilation and warm-up effects.

## Interpreting results

- **GPU time faster, total time slower** usually means the shader work is fine but transfer/setup cost dominates.
- **Both GPU and total time faster** indicates a good browser/GPU fit for that workload.
- **Radix slower than Bitonic** can happen on smaller arrays where extra passes do not amortize well.

## Practical tips

### Reuse the same context

```ts
const gpu = new GPUContext();
await gpu.initialize();

const sorter = new BitonicSorter(gpu);
await sorter.sort(batchA);
await sorter.sort(batchB);
```

### Preallocate when sizes are predictable

```ts
const sorter = new RadixSorter(gpu);
sorter.preallocate(1_000_000);
```

### Measure both correctness and throughput

Enable validation while developing, then disable it when you only want raw throughput measurements.

## Run your own benchmark

The repository ships a maintained browser playground specifically for this purpose. Open the [interactive demo](/demo), choose your workload size, and compare Bitonic, Radix, and CPU timings on the target machine.
