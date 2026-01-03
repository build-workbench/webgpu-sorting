// Bitonic Sort WGSL Compute Shader
// Implements both local (within workgroup) and global (across workgroups) sorting

struct Uniforms {
  stage: u32,      // Current stage (k in bitonic sort)
  pass_num: u32,   // Current pass within stage (j in bitonic sort)
  total_size: u32, // Total array size
}

@group(0) @binding(0) var<storage, read_write> data: array<u32>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

const WORKGROUP_SIZE: u32 = 256u;

// Shared memory for local sorting within workgroup
var<workgroup> shared_data: array<u32, 512>;

// Global bitonic sort step - for large arrays across workgroups
@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_global(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  
  if (idx >= uniforms.total_size) {
    return;
  }
  
  let stage = uniforms.stage;
  let pass_num = uniforms.pass_num;
  
  // Calculate partner index using XOR
  let pair_distance = 1u << pass_num;
  let block_size = 1u << (stage + 1u);
  
  let partner = idx ^ pair_distance;
  
  // Only process if partner is valid and we're the lower index
  if (partner >= uniforms.total_size || partner <= idx) {
    return;
  }
  
  // Determine sort direction based on position in block
  let block_idx = idx / block_size;
  let ascending = (block_idx % 2u) == 0u;
  
  let a = data[idx];
  let b = data[partner];
  
  // Compare and swap if needed
  if ((a > b) == ascending) {
    data[idx] = b;
    data[partner] = a;
  }
}

// Local bitonic sort - optimized for sorting within a single workgroup using shared memory
@compute @workgroup_size(WORKGROUP_SIZE)
fn bitonic_sort_local(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let local_idx = local_id.x;
  let global_idx = global_id.x;
  let workgroup_offset = workgroup_id.x * WORKGROUP_SIZE;
  
  // Load data into shared memory
  if (global_idx < uniforms.total_size) {
    shared_data[local_idx] = data[global_idx];
  } else {
    shared_data[local_idx] = 0xFFFFFFFFu; // Max value for padding
  }
  
  workgroupBarrier();
  
  // Perform bitonic sort within workgroup
  // log2(WORKGROUP_SIZE) = 8 stages for 256 threads
  for (var stage: u32 = 0u; stage < 8u; stage = stage + 1u) {
    for (var pass_num: u32 = stage + 1u; pass_num > 0u; pass_num = pass_num - 1u) {
      let pair_distance = 1u << (pass_num - 1u);
      let block_size = 1u << (stage + 1u);
      
      let partner = local_idx ^ pair_distance;
      
      if (partner > local_idx && partner < WORKGROUP_SIZE) {
        // Determine sort direction
        let block_idx = local_idx / block_size;
        let ascending = (block_idx % 2u) == 0u;
        
        let a = shared_data[local_idx];
        let b = shared_data[partner];
        
        if ((a > b) == ascending) {
          shared_data[local_idx] = b;
          shared_data[partner] = a;
        }
      }
      
      workgroupBarrier();
    }
  }
  
  // Write back to global memory
  if (global_idx < uniforms.total_size) {
    data[global_idx] = shared_data[local_idx];
  }
}
