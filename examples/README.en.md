# Examples

This directory contains various usage examples for the WebGPU Sorting library.

## Example List

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates the most basic usage flow:

- Check WebGPU support
- Initialize GPU context
- Create sorter instance
- Execute sorting
- Validate results
- Clean up resources

**Best for**: Beginners, quick start

**Run**:

```bash
npm run dev
# Run in browser console
```

### 2. Performance Comparison (`performance-comparison.ts`)

Compares performance of different sorting algorithms:

- Bitonic Sort vs Radix Sort vs JS Sort
- Performance across different array sizes
- Speedup ratio calculation

**Best for**: Understanding performance characteristics, choosing the right algorithm

**Run**:

```bash
npm run dev
# Run in browser console
```

### 3. Batch Processing (`batch-processing.ts`)

Demonstrates efficient processing of multiple arrays:

- Reusing GPU instances vs creating new instances each time
- Performance comparison
- Best practices

**Best for**: Scenarios requiring processing of large amounts of data

**Run**:

```bash
npm run dev
# Run in browser console
```

### 4. Error Handling (`error-handling.ts`)

Demonstrates comprehensive error handling:

- Check WebGPU support
- Handle initialization errors
- Handle sorting errors
- Fallback strategies
- Resource cleanup

**Best for**: Production use, robust error handling required

**Run**:

```bash
npm run dev
# Run in browser console
```

---

## How to Run Examples

### Method 1: Run in Browser

1. Start the development server:

```bash
npm run dev
```

2. Open browser at http://localhost:5173

3. Open browser console (F12)

4. Import and run examples in console:

```javascript
// Import example module
import('./examples/basic-usage.js');
```

### Method 2: Modify main.ts

1. Edit `src/main.ts`, import the example:

```typescript
import './examples/basic-usage';
```

2. Start the development server:

```bash
npm run dev
```

3. View browser console output

### Method 3: Create Standalone HTML File

1. Create `example.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>WebGPU Sorting Example</title>
  </head>
  <body>
    <h1>WebGPU Sorting Example</h1>
    <p>Open console to see output</p>
    <script type="module" src="/examples/basic-usage.ts"></script>
  </body>
</html>
```

2. Start the development server and visit `example.html`

---

## Example Code Structure

Each example follows a similar structure:

```typescript
/**
 * Example Title
 *
 * Example description
 */

import { ... } from '../src';

async function exampleFunction() {
  console.log('=== Example Start ===\n');

  // 1. Initialize
  // ...

  // 2. Execute operations
  // ...

  // 3. Display results
  // ...

  // 4. Clean up resources
  // ...

  console.log('\n=== Example Complete ===');
}

// Run example
exampleFunction().catch(error => {
  console.error('Error:', error);
});
```

---

## Common Issues

### Q: Examples won't run?

**A**: Ensure:

1. Browser supports WebGPU (Chrome 113+, Edge 113+)
2. Development server is running (`npm run dev`)
3. Check browser console for error messages

### Q: Performance not as expected?

**A**:

1. Use larger arrays (>10K elements)
2. Ensure discrete GPU is used (integrated GPUs have lower performance)
3. Close other GPU-intensive applications
4. Use `powerPreference: 'high-performance'`

### Q: How to modify examples?

**A**:

1. Edit example files directly
2. Vite will auto-reload
3. Refresh browser to see changes

---

## Create Your Own Example

1. Create a new file in `examples/` directory:

```typescript
// examples/my-example.ts
import { GPUContext, BitonicSorter } from '../src';

async function myExample() {
  // Your code here
}

myExample().catch(console.error);
```

2. Import in `src/main.ts`:

```typescript
import './examples/my-example';
```

3. Run development server to see results

---

## More Resources

- [API Documentation](../docs/API.md)
- [Technical Documentation](../docs/TECHNICAL.md)
- [Getting Started Guide](../docs/GETTING_STARTED.md)
- [Main README](../README.md)

---

## Contributing

Contributions of new examples are welcome! Please refer to [CONTRIBUTING.md](../CONTRIBUTING.md).

---

> **中文版本**: 参见 [README.md](./README.md)
