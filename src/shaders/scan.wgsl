// Blelloch Scan WGSL Compute Shaders
// Work-efficient parallel exclusive prefix sum
// This module provides GPU-based prefix sum computation

struct ScanUniforms {
  data_size: u32,      // Total elements to scan
  num_blocks: u32,     // Number of workgroups/blocks
  _pad1: u32,
  _pad2: u32,
}

const SCAN_WORKGROUP_SIZE: u32 = 256u;  // Size for prefix sum scan

// Shared memory for local Blelloch scan within a workgroup
var<workgroup> scan_shared: array<u32, 512>;  // Must be >= 2 * SCAN_WORKGROUP_SIZE

// Bindings for prefix sum scan
@group(0) @binding(0) var<storage, read> scan_input: array<u32>;
@group(0) @binding(1) var<storage, read_write> scan_output: array<u32>;
@group(0) @binding(2) var<storage, read_write> block_sums: array<u32>;  // Sum of each block
@group(0) @binding(3) var<uniform> scan_uniforms: ScanUniforms;

// Blelloch scan - exclusive prefix sum
// Phase 1: Up-sweep (reduce) - build binary tree of partial sums
// Phase 2: Down-sweep (distribute) - propagate sums down the tree
@compute @workgroup_size(SCAN_WORKGROUP_SIZE)
fn blelloch_scan(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let tid = local_id.x;
  let gid = global_id.x;
  let block_id = workgroup_id.x;
  let n = scan_uniforms.data_size;
  let block_size = SCAN_WORKGROUP_SIZE * 2u;  // Each workgroup processes 512 elements

  // Calculate the range this workgroup handles
  let block_start = block_id * block_size;

  // Load data into shared memory (coalesced reads)
  // Each thread loads 2 elements
  let idx0 = block_start + tid;
  let idx1 = block_start + tid + SCAN_WORKGROUP_SIZE;

  // Initialize shared memory
  if (idx0 < n) {
    scan_shared[tid] = scan_input[idx0];
  } else {
    scan_shared[tid] = 0u;
  }

  if (idx1 < n) {
    scan_shared[tid + SCAN_WORKGROUP_SIZE] = scan_input[idx1];
  } else {
    scan_shared[tid + SCAN_WORKGROUP_SIZE] = 0u;
  }

  workgroupBarrier();

  // ========================================================================
  // Phase 1: Up-sweep (Reduce)
  // Build a binary tree of partial sums from leaves to root.
  // Operate on the full block_size array; positions beyond the data are
  // padded with 0 and therefore do not affect the sums, but skipping them
  // would break the tree structure and produce wrong prefix sums.
  // ========================================================================
  var offset = 1u;
  var d = block_size / 2u;
  while (d > 0u) {
    workgroupBarrier();

    if (tid < d) {
      let ai = offset * (2u * tid + 1u) - 1u;
      let bi = offset * (2u * tid + 2u) - 1u;

      scan_shared[bi] = scan_shared[ai] + scan_shared[bi];
    }

    offset *= 2u;
    d /= 2u;
  }

  workgroupBarrier();

  // ========================================================================
  // Phase 2: Down-sweep (Distribute)
  // Propagate partial sums from root to leaves
  // ========================================================================
  // Clear the last element (makes it exclusive scan)
  if (tid == 0u) {
    // Store block sum before clearing (for multi-block scan)
    let block_sum = scan_shared[block_size - 1u];
    block_sums[block_id] = block_sum;
    scan_shared[block_size - 1u] = 0u;
  }

  workgroupBarrier();

  d = 1u;
  while (d < block_size) {
    offset /= 2u;
    workgroupBarrier();

    if (tid < d) {
      let ai = offset * (2u * tid + 1u) - 1u;
      let bi = offset * (2u * tid + 2u) - 1u;

      let t = scan_shared[ai];
      scan_shared[ai] = scan_shared[bi];
      scan_shared[bi] = t + scan_shared[bi];
    }

    d *= 2u;
  }

  workgroupBarrier();

  // ========================================================================
  // Write results back to global memory
  // ========================================================================
  if (idx0 < n) {
    scan_output[idx0] = scan_shared[tid];
  }

  if (idx1 < n) {
    scan_output[idx1] = scan_shared[tid + SCAN_WORKGROUP_SIZE];
  }
}

// Shared memory for block sum scan (smaller, max blocks typically < 1024)
var<workgroup> block_scan_shared: array<u32, 512>;

// Scan the block sums (second level of two-level scan)
@compute @workgroup_size(SCAN_WORKGROUP_SIZE)
fn scan_block_sums(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let tid = local_id.x;
  let n = scan_uniforms.num_blocks;

  // Load block sums into shared memory
  if (tid < n) {
    block_scan_shared[tid] = block_sums[tid];
  } else {
    block_scan_shared[tid] = 0u;
  }

  // Pad with zeros
  if (tid + SCAN_WORKGROUP_SIZE < n) {
    block_scan_shared[tid + SCAN_WORKGROUP_SIZE] = block_sums[tid + SCAN_WORKGROUP_SIZE];
  } else if (tid + SCAN_WORKGROUP_SIZE < 512u) {
    block_scan_shared[tid + SCAN_WORKGROUP_SIZE] = 0u;
  }

  workgroupBarrier();

  // ========================================================================
  // Phase 1: Up-sweep (Reduce)
  // Operate on the full 512-element array; padding is 0 so it does not
  // affect the sum, but skipping padded positions would break the tree.
  // ========================================================================
  var offset = 1u;
  var d = 256u;  // SCAN_WORKGROUP_SIZE
  while (d > 0u) {
    workgroupBarrier();

    if (tid < d) {
      let ai = offset * (2u * tid + 1u) - 1u;
      let bi = offset * (2u * tid + 2u) - 1u;

      block_scan_shared[bi] = block_scan_shared[ai] + block_scan_shared[bi];
    }

    offset *= 2u;
    d /= 2u;
  }

  workgroupBarrier();

  // ========================================================================
  // Phase 2: Down-sweep (Distribute)
  // ========================================================================
  if (tid == 0u) {
    block_scan_shared[511u] = 0u;  // Clear last element for exclusive scan
  }

  workgroupBarrier();

  d = 1u;
  while (d < 512u) {
    offset /= 2u;
    workgroupBarrier();

    if (tid < d) {
      let ai = offset * (2u * tid + 1u) - 1u;
      let bi = offset * (2u * tid + 2u) - 1u;

      let t = block_scan_shared[ai];
      block_scan_shared[ai] = block_scan_shared[bi];
      block_scan_shared[bi] = t + block_scan_shared[bi];
    }

    d *= 2u;
  }

  workgroupBarrier();

  // Write scanned block sums back
  if (tid < n) {
    block_sums[tid] = block_scan_shared[tid];
  }
}

// Add block prefixes to each block's local scan results
// This is the third step of two-level scan
@compute @workgroup_size(SCAN_WORKGROUP_SIZE)
fn add_block_prefixes(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let tid = local_id.x;
  let gid = global_id.x;
  let block_id = workgroup_id.x;
  let n = scan_uniforms.data_size;

  // Get the prefix for this block (sum of all previous blocks)
  let block_prefix = block_sums[block_id];

  // Add block prefix to each element in this block
  let idx = gid;
  if (idx < n) {
    scan_output[idx] = scan_output[idx] + block_prefix;
  }
}