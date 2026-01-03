// Parallel Prefix Sum (Scan) WGSL Compute Shader
// Implements Blelloch scan algorithm for exclusive prefix sum

struct ScanUniforms {
  n: u32,           // Number of elements
  offset: u32,      // Offset for multi-block scan
  _pad0: u32,
  _pad1: u32,
}

@group(0) @binding(0) var<storage, read_write> data: array<u32>;
@group(0) @binding(1) var<uniform> uniforms: ScanUniforms;

const WORKGROUP_SIZE: u32 = 256u;
const ELEMENTS_PER_WORKGROUP: u32 = 512u; // Each thread handles 2 elements

var<workgroup> temp: array<u32, 512>;

// Workgroup-level exclusive prefix sum using Blelloch scan
@compute @workgroup_size(WORKGROUP_SIZE)
fn prefix_sum_local(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let tid = local_id.x;
  let base_idx = workgroup_id.x * ELEMENTS_PER_WORKGROUP;
  
  // Load data into shared memory (each thread loads 2 elements)
  let idx1 = base_idx + 2u * tid;
  let idx2 = base_idx + 2u * tid + 1u;
  
  if (idx1 < uniforms.n) {
    temp[2u * tid] = data[idx1];
  } else {
    temp[2u * tid] = 0u;
  }
  
  if (idx2 < uniforms.n) {
    temp[2u * tid + 1u] = data[idx2];
  } else {
    temp[2u * tid + 1u] = 0u;
  }
  
  // Up-sweep (reduce) phase
  var offset: u32 = 1u;
  for (var d: u32 = ELEMENTS_PER_WORKGROUP >> 1u; d > 0u; d = d >> 1u) {
    workgroupBarrier();
    
    if (tid < d) {
      let ai = offset * (2u * tid + 1u) - 1u;
      let bi = offset * (2u * tid + 2u) - 1u;
      temp[bi] = temp[bi] + temp[ai];
    }
    
    offset = offset * 2u;
  }
  
  // Clear the last element (for exclusive scan)
  if (tid == 0u) {
    temp[ELEMENTS_PER_WORKGROUP - 1u] = 0u;
  }
  
  // Down-sweep phase
  for (var d: u32 = 1u; d < ELEMENTS_PER_WORKGROUP; d = d * 2u) {
    offset = offset >> 1u;
    workgroupBarrier();
    
    if (tid < d) {
      let ai = offset * (2u * tid + 1u) - 1u;
      let bi = offset * (2u * tid + 2u) - 1u;
      let t = temp[ai];
      temp[ai] = temp[bi];
      temp[bi] = temp[bi] + t;
    }
  }
  
  workgroupBarrier();
  
  // Write results back to global memory
  if (idx1 < uniforms.n) {
    data[idx1] = temp[2u * tid];
  }
  
  if (idx2 < uniforms.n) {
    data[idx2] = temp[2u * tid + 1u];
  }
}

// Add block sums to complete multi-block scan
@compute @workgroup_size(WORKGROUP_SIZE)
fn add_block_sums(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let idx = global_id.x;
  
  if (idx >= uniforms.n || workgroup_id.x == 0u) {
    return;
  }
  
  // Add the scanned block sum to this element
  data[idx] = data[idx] + data[uniforms.offset + workgroup_id.x - 1u];
}
