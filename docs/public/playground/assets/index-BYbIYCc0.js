(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class extends Error{constructor(e=`WebGPU is not supported in this browser`){super(e),this.name=`WebGPUNotSupportedError`}},t=class extends Error{constructor(e=`Failed to get GPU adapter`){super(e),this.name=`GPUAdapterError`}},n=class extends Error{constructor(e=`Failed to get GPU device`){super(e),this.name=`GPUDeviceError`}},r=class extends Error{constructor(e=`Failed to allocate GPU buffer`){super(e),this.name=`BufferAllocationError`}},i=class extends Error{constructor(e=`Failed to map GPU buffer`){super(e),this.name=`BufferMapError`}},a=class extends Error{constructor(e=`Failed to compile shader`){super(e),this.name=`ShaderCompilationError`}},o=class extends Error{constructor(e=`GPU operation timed out`){super(e),this.name=`GPUTimeoutError`}};function s(){return typeof navigator>`u`||!(`gpu`in navigator)?null:navigator.gpu}var c={isSupported(){return s()!==null},async requestAdapter(e){return await s()?.requestAdapter(e)??null}},l=class{adapter=null;device=null;initialized=!1;runtime;constructor(e=c){this.runtime=e}static isSupported(e=c){return e.isSupported()}async initialize(r){if(this.initialized)return;if(!this.runtime.isSupported())throw new e;if(this.adapter=await this.runtime.requestAdapter({powerPreference:r?.powerPreference??`high-performance`}),!this.adapter)throw new t;let i=this.adapter.limits,a={maxStorageBufferBindingSize:Math.min(i.maxStorageBufferBindingSize,r?.requiredLimits?.maxStorageBufferBindingSize??i.maxStorageBufferBindingSize),maxBufferSize:Math.min(i.maxBufferSize,r?.requiredLimits?.maxBufferSize??i.maxBufferSize)};if(this.device=await this.adapter.requestDevice({requiredFeatures:[],requiredLimits:a}),!this.device)throw new n;this.device.lost.then(e=>{console.error(`GPU device lost:`,e.message),this.initialized=!1,this.device=null}),this.initialized=!0}getDevice(){if(!this.device)throw new n(`GPUContext not initialized. Call initialize() first.`);return this.device}isInitialized(){return this.initialized}destroy(){this.device&&=(this.device.destroy(),null),this.adapter=null,this.initialized=!1}};async function u(e,t={}){let{timeoutMs:n=3e4,message:r=`GPU operation timed out`}=t,i,a=new Promise((e,t)=>{i=setTimeout(()=>{t(new o(r))},n)});try{return await Promise.race([e,a])}finally{i!==void 0&&clearTimeout(i)}}function d(e){return e instanceof Error?e.message:String(e)}var f=class e{device;buffers=new Set;constructor(e){this.device=e}static alignSize(e,t){if(t<=0)throw Error(`Alignment must be positive`);return Math.ceil(e/t)*t}createStorageBuffer(t,n){let i=e.alignSize(t.byteLength,4);try{let e=this.device.createBuffer({label:n??`storage-buffer`,size:i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});return new Uint32Array(e.getMappedRange()).set(t),e.unmap(),this.buffers.add(e),e}catch(e){throw new r(`Failed to create storage buffer: ${d(e)}`)}}createStagingBuffer(t){let n=e.alignSize(t,4);try{let e=this.device.createBuffer({label:`staging-buffer`,size:n,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});return this.buffers.add(e),e}catch(e){throw new r(`Failed to create staging buffer: ${d(e)}`)}}createUniformBuffer(t,n){let i=e.alignSize(t,16);try{let e=this.device.createBuffer({label:n??`uniform-buffer`,size:i,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return this.buffers.add(e),e}catch(e){throw new r(`Failed to create uniform buffer: ${d(e)}`)}}async readBuffer(t,n){let r=e.alignSize(n,4),a=this.createStagingBuffer(r);try{let e=this.device.createCommandEncoder();e.copyBufferToBuffer(t,0,a,0,r),this.device.queue.submit([e.finish()]),await u(a.mapAsync(GPUMapMode.READ),{message:`Buffer mapping timed out`});let i=a.getMappedRange(),o=new Uint32Array(i.slice(0,n));return a.unmap(),this.releaseBuffer(a),o}catch(e){throw this.releaseBuffer(a),e instanceof o?e:new i(`Failed to read buffer: ${d(e)}`)}}releaseBuffer(e){this.buffers.has(e)&&(e.destroy(),this.buffers.delete(e))}releaseAll(){for(let e of this.buffers)e.destroy();this.buffers.clear()}},p=class{releasers=new Map;track(e,t){return this.releasers.set(e,()=>{if(t){t(e);return}e.destroy()}),e}untrack(e){this.releasers.delete(e)}releaseAll(){for(let e of this.releasers.values())e();this.releasers.clear()}},m=class e{static isSorted(e){if(e.length<=1)return!0;for(let t=0;t<e.length-1;t++)if(e[t]>e[t+1])return!1;return!0}static hasSameElements(e,t){if(e.length!==t.length)return!1;if(e.length===0)return!0;let n=new Map,r=new Map;for(let i=0;i<e.length;i++)n.set(e[i],(n.get(e[i])??0)+1),r.set(t[i],(r.get(t[i])??0)+1);if(n.size!==r.size)return!1;for(let[e,t]of n)if(r.get(e)!==t)return!1;return!0}static validate(t,n){let r=[],i=e.isSorted(n);i||r.push(`Output array is not sorted in ascending order`);let a=e.hasSameElements(t,n);return a||r.push(`Output array does not contain the same elements as input`),{isValid:i&&a,isSorted:i,hasAllElements:a,errors:r}}},h=`// Bitonic Sort WGSL Compute Shader
// Implements both local (within workgroup) and global (across workgroups) sorting
//
// IMPORTANT: WORKGROUP_SIZE must match the value in src/constants.ts
// @see src/constants.ts - WORKGROUP_SIZE = 256

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
`,g=[1024,10240,102400,1048576],_=1e4,v=class e{device;bufferManager;localPipeline=null;globalPipeline=null;bindGroupLayout=null;initialized=!1;preallocatedBuffer=null;_preallocatedSize=0;constructor(e){this.device=e.getDevice(),this.bufferManager=new f(this.device)}get preallocatedSize(){return this._preallocatedSize}preallocate(t){this.clearPreallocation();let n=e.nextPowerOf2(t);this.preallocatedBuffer=this.device.createBuffer({label:`preallocated-bitonic-data`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this._preallocatedSize=t}clearPreallocation(){this.preallocatedBuffer&&(this.preallocatedBuffer.destroy(),this.preallocatedBuffer=null,this._preallocatedSize=0)}static nextPowerOf2(e){if(e<=0)return 1;if(!(e&e-1))return e;let t=1;for(;t<e;)t*=2;return t}static isPowerOf2(e){return e>0&&(e&e-1)==0}async initializePipelines(){if(this.initialized)return;let e=this.device.createShaderModule({label:`bitonic-sort-shader`,code:h}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Bitonic shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.bindGroupLayout=this.device.createBindGroupLayout({label:`bitonic-bind-group-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]});let n=this.device.createPipelineLayout({label:`bitonic-pipeline-layout`,bindGroupLayouts:[this.bindGroupLayout]});this.localPipeline=this.device.createComputePipeline({label:`bitonic-local-pipeline`,layout:n,compute:{module:e,entryPoint:`bitonic_sort_local`}}),this.globalPipeline=this.device.createComputePipeline({label:`bitonic-global-pipeline`,layout:n,compute:{module:e,entryPoint:`bitonic_sort_global`}}),this.initialized=!0}async sort(t,n){let r=performance.now();await this.initializePipelines();let i=t.length;if(i<=1)return{sortedData:new Uint32Array(t),gpuTimeMs:0,totalTimeMs:performance.now()-r};let o=e.nextPowerOf2(i),s=new Uint32Array(o);s.set(t);for(let e=i;e<o;e++)s[e]=4294967295;let c=this.preallocatedBuffer,l=c!==null&&this._preallocatedSize>=i,u=new p,d,f,h;try{l?(this.device.queue.writeBuffer(c,0,s.buffer,s.byteOffset,s.byteLength),d=c):d=u.track(this.bufferManager.createStorageBuffer(s,`sort-data`),e=>this.bufferManager.releaseBuffer(e));let t=u.track(this.bufferManager.createUniformBuffer(16,`sort-uniforms`),e=>this.bufferManager.releaseBuffer(e)),n=this.bindGroupLayout;if(!n)throw new a(`Shader pipelines not initialized`);let r=this.device.createBindGroup({label:`bitonic-bind-group`,layout:n,entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:t}}]}),p=performance.now();if(!e.isPowerOf2(o))throw Error(`Invalid paddedSize: ${o} is not a power of 2`);let m=Math.ceil(o/256),g=Math.trunc(Math.log2(o));{let e=this.localPipeline;if(!e)throw new a(`Local pipeline not initialized`);let n=new Uint32Array([0,0,o,0]);this.device.queue.writeBuffer(t,0,n);let i=this.device.createCommandEncoder(),s=i.beginComputePass();s.setPipeline(e),s.setBindGroup(0,r),s.dispatchWorkgroups(m),s.end(),this.device.queue.submit([i.finish()])}let _=Math.trunc(Math.log2(256)),v=this.globalPipeline;if(!v)throw new a(`Global pipeline not initialized`);for(let e=_;e<g;e++)for(let n=e;n>=0;n--){let i=new Uint32Array([e,n,o,0]);this.device.queue.writeBuffer(t,0,i);let a=this.device.createCommandEncoder(),s=a.beginComputePass();s.setPipeline(v),s.setBindGroup(0,r),s.dispatchWorkgroups(m),s.end(),this.device.queue.submit([a.finish()])}await this.device.queue.onSubmittedWorkDone();let y=performance.now();f=(await this.bufferManager.readBuffer(d,o*4)).slice(0,i),h=y-p}finally{u.releaseAll()}if(!f)throw Error(`Bitonic sort completed without producing output`);if(h===void 0)throw Error(`Bitonic sort completed without timing information`);let g=performance.now();if(n?.validate){let e=m.validate(t,f);if(!e.isValid)throw Error(`Sort validation failed: ${e.errors.join(`, `)}`)}return{sortedData:f,gpuTimeMs:h,totalTimeMs:g-r}}destroy(){this.clearPreallocation(),this.bufferManager.releaseAll(),this.localPipeline=null,this.globalPipeline=null,this.bindGroupLayout=null,this.initialized=!1}},y=`// Blelloch Scan WGSL Compute Shaders
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
}`,b=256,x=b*2,S=class{device;bufferManager;blellochScanPipeline=null;scanBlockSumsPipeline=null;addBlockPrefixesPipeline=null;scanBindGroupLayout=null;initialized=!1;constructor(e){this.device=e.getDevice(),this.bufferManager=new f(this.device)}async initialize(){if(this.initialized)return;let e=this.device.createShaderModule({label:`scan-shader`,code:y}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Scan shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.scanBindGroupLayout=this.device.createBindGroupLayout({label:`scan-bind-group-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]});let n=this.device.createPipelineLayout({label:`scan-pipeline-layout`,bindGroupLayouts:[this.scanBindGroupLayout]});this.blellochScanPipeline=this.device.createComputePipeline({label:`blelloch-scan-pipeline`,layout:n,compute:{module:e,entryPoint:`blelloch_scan`}}),this.scanBlockSumsPipeline=this.device.createComputePipeline({label:`scan-block-sums-pipeline`,layout:n,compute:{module:e,entryPoint:`scan_block_sums`}}),this.addBlockPrefixesPipeline=this.device.createComputePipeline({label:`add-block-prefixes-pipeline`,layout:n,compute:{module:e,entryPoint:`add_block_prefixes`}}),this.initialized=!0}async computeExclusivePrefixSum(e){if(!this.initialized)throw new a(`ScanModule not initialized. Call initialize() first.`);let t=e.length;if(t===0)return new Uint32Array;if(t===1)return new Uint32Array([0]);let n=Math.ceil(t/x),r=new p;try{let i=r.track(this.bufferManager.createStorageBuffer(e,`scan-input`),e=>this.bufferManager.releaseBuffer(e)),a=r.track(this.device.createBuffer({label:`scan-output`,size:f.alignSize(t*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),o=r.track(this.device.createBuffer({label:`scan-block-sums`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),s=r.track(this.bufferManager.createUniformBuffer(16,`scan-uniforms`),e=>this.bufferManager.releaseBuffer(e));return this.computePrefixSumGPU(i,a,o,s,t),await this.device.queue.onSubmittedWorkDone(),await this.bufferManager.readBuffer(a,t*4)}finally{r.releaseAll()}}computePrefixSumGPU(e,t,n,r,i){let o=this.scanBindGroupLayout,s=this.blellochScanPipeline,c=this.scanBlockSumsPipeline,l=this.addBlockPrefixesPipeline;if(!o||!s||!c||!l)throw new a(`Scan pipelines not initialized`);let u=Math.ceil(i/x),d=new Uint32Array([i,u,0,0]);this.device.queue.writeBuffer(r,0,d);let f=this.device.createCommandEncoder();{let i=this.device.createBindGroup({label:`blelloch-scan-bind-group`,layout:o,entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:n}},{binding:3,resource:{buffer:r}}]}),a=f.beginComputePass();a.setPipeline(s),a.setBindGroup(0,i),a.dispatchWorkgroups(u),a.end()}if(u>1){let i=this.device.createBindGroup({label:`scan-block-sums-bind-group`,layout:o,entries:[{binding:0,resource:{buffer:n}},{binding:1,resource:{buffer:n}},{binding:2,resource:{buffer:n}},{binding:3,resource:{buffer:r}}]}),a=f.beginComputePass();a.setPipeline(c),a.setBindGroup(0,i),a.dispatchWorkgroups(1),a.end();{let i=this.device.createBindGroup({label:`add-block-prefixes-bind-group`,layout:o,entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:n}},{binding:3,resource:{buffer:r}}]}),a=f.beginComputePass();a.setPipeline(l),a.setBindGroup(0,i),a.dispatchWorkgroups(u),a.end()}}this.device.queue.submit([f.finish()])}static getConstants(){return{scanWorkgroupSize:b,elementsPerScanBlock:x}}destroy(){this.bufferManager.releaseAll(),this.blellochScanPipeline=null,this.scanBlockSumsPipeline=null,this.addBlockPrefixesPipeline=null,this.scanBindGroupLayout=null,this.initialized=!1}},C=`// Radix Sort WGSL Compute Shaders
// Implements 4-bit radix sort with histogram and scatter
// Prefix sum computation is handled by scan.wgsl
//
// IMPORTANT: WORKGROUP_SIZE and RADIX must match the values in src/constants.ts
// @see src/constants.ts - WORKGROUP_SIZE = 256, RADIX = 16

struct RadixUniforms {
  bit_offset: u32,   // Current bit position (0, 4, 8, ..., 28)
  total_size: u32,   // Total number of elements
  num_workgroups: u32,
  _pad: u32,
}

const WORKGROUP_SIZE: u32 = 256u;
const RADIX: u32 = 16u;  // 4-bit radix = 16 buckets

@group(0) @binding(0) var<storage, read> input_data: array<u32>;
@group(0) @binding(1) var<storage, read_write> output_data: array<u32>;
@group(0) @binding(2) var<storage, read_write> histogram: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> prefix_sums: array<u32>;
@group(0) @binding(4) var<uniform> uniforms: RadixUniforms;

var<workgroup> local_histogram: array<atomic<u32>, 16>;
var<workgroup> local_prefix: array<u32, 16>;

// Extract 4-bit digit at given bit offset
fn get_digit(value: u32, bit_offset: u32) -> u32 {
  return (value >> bit_offset) & 0xFu;
}

// Compute local histogram for each workgroup
@compute @workgroup_size(WORKGROUP_SIZE)
fn compute_histogram(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let tid = local_id.x;
  let gid = global_id.x;
  
  // Initialize local histogram
  if (tid < RADIX) {
    atomicStore(&local_histogram[tid], 0u);
  }
  
  workgroupBarrier();
  
  // Count digits in this workgroup
  if (gid < uniforms.total_size) {
    let digit = get_digit(input_data[gid], uniforms.bit_offset);
    atomicAdd(&local_histogram[digit], 1u);
  }
  
  workgroupBarrier();
  
  // Add local histogram to global histogram
  if (tid < RADIX) {
    let local_count = atomicLoad(&local_histogram[tid]);
    let global_idx = tid * uniforms.num_workgroups + workgroup_id.x;
    atomicAdd(&histogram[global_idx], local_count);
  }
}

// Scatter elements to their sorted positions
@compute @workgroup_size(WORKGROUP_SIZE)
fn scatter(
  @builtin(global_invocation_id) global_id: vec3<u32>,
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let tid = local_id.x;
  let gid = global_id.x;

  // Load prefix sums for this workgroup into shared memory
  if (tid < RADIX) {
    let global_idx = tid * uniforms.num_workgroups + workgroup_id.x;
    local_prefix[tid] = prefix_sums[global_idx];
  }

  // Reset local histogram for counting
  if (tid < RADIX) {
    atomicStore(&local_histogram[tid], 0u);
  }

  workgroupBarrier();

  if (gid < uniforms.total_size) {
    let value = input_data[gid];
    let digit = get_digit(value, uniforms.bit_offset);

    // Get position within this digit's bucket
    let local_offset = atomicAdd(&local_histogram[digit], 1u);

    // Calculate global output position
    let global_offset = local_prefix[digit] + local_offset;

    output_data[global_offset] = value;
  }
}
`,w=class{device;bufferManager;scanModule;histogramPipeline=null;scatterPipeline=null;bindGroupLayout=null;preallocatedBuffers=null;_preallocatedSize=0;initialized=!1;constructor(e){this.device=e.getDevice(),this.bufferManager=new f(this.device),this.scanModule=new S(e)}get preallocatedSize(){return this._preallocatedSize}preallocate(e){this.clearPreallocation();let{elementsPerScanBlock:t}=S.getConstants(),n=16*Math.ceil(e/256),r=Math.ceil(n/t);this.preallocatedBuffers={input:this.device.createBuffer({label:`preallocated-radix-input`,size:f.alignSize(e*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),output:this.device.createBuffer({label:`preallocated-radix-output`,size:f.alignSize(e*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),histogram:this.device.createBuffer({label:`preallocated-radix-histogram`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),prefixSum:this.device.createBuffer({label:`preallocated-radix-prefix-sum`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),blockSums:this.device.createBuffer({label:`preallocated-radix-block-sums`,size:f.alignSize(r*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})},this._preallocatedSize=e}clearPreallocation(){this.preallocatedBuffers&&(this.preallocatedBuffers.input.destroy(),this.preallocatedBuffers.output.destroy(),this.preallocatedBuffers.histogram.destroy(),this.preallocatedBuffers.prefixSum.destroy(),this.preallocatedBuffers.blockSums.destroy(),this.preallocatedBuffers=null,this._preallocatedSize=0)}async initializePipelines(){if(this.initialized)return;let e=this.device.createShaderModule({label:`radix-sort-shader`,code:C}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Radix shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.bindGroupLayout=this.device.createBindGroupLayout({label:`radix-bind-group-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]});let n=this.device.createPipelineLayout({label:`radix-pipeline-layout`,bindGroupLayouts:[this.bindGroupLayout]});this.histogramPipeline=this.device.createComputePipeline({label:`radix-histogram-pipeline`,layout:n,compute:{module:e,entryPoint:`compute_histogram`}}),this.scatterPipeline=this.device.createComputePipeline({label:`radix-scatter-pipeline`,layout:n,compute:{module:e,entryPoint:`scatter`}}),await this.scanModule.initialize(),this.initialized=!0}async sort(e,t){let n=performance.now();await this.initializePipelines();let r=e.length;if(r<=1)return{sortedData:new Uint32Array(e),gpuTimeMs:0,totalTimeMs:performance.now()-n};let{elementsPerScanBlock:i}=S.getConstants(),o=Math.ceil(r/256),s=16*o,c=Math.ceil(s/i),l=this.preallocatedBuffers,u=l!==null&&this._preallocatedSize>=r,d=new p,h,g,_,v,y,b,x;try{let t,n;u?(this.device.queue.writeBuffer(l.input,0,e.buffer,e.byteOffset,e.byteLength),h=l.input,g=l.output,_=l.histogram,v=l.prefixSum,y=l.blockSums,t=d.track(this.bufferManager.createUniformBuffer(16,`radix-uniforms`),e=>this.bufferManager.releaseBuffer(e)),n=d.track(this.bufferManager.createUniformBuffer(16,`scan-uniforms`),e=>this.bufferManager.releaseBuffer(e))):(h=d.track(this.bufferManager.createStorageBuffer(e,`radix-input`),e=>this.bufferManager.releaseBuffer(e)),g=d.track(this.device.createBuffer({label:`radix-output`,size:f.alignSize(r*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),_=d.track(this.device.createBuffer({label:`radix-histogram`,size:f.alignSize(s*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),v=d.track(this.device.createBuffer({label:`radix-prefix-sum`,size:f.alignSize(s*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),y=d.track(this.device.createBuffer({label:`radix-block-sums`,size:f.alignSize(c*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),t=d.track(this.bufferManager.createUniformBuffer(16,`radix-uniforms`),e=>this.bufferManager.releaseBuffer(e)),n=d.track(this.bufferManager.createUniformBuffer(16,`scan-uniforms`),e=>this.bufferManager.releaseBuffer(e)));let i=h,p=g,m=performance.now();for(let e=0;e<8;e++){let c=e*4,l=new Uint32Array(s);this.device.queue.writeBuffer(_,0,l);let u=new Uint32Array([c,r,o,0]);this.device.queue.writeBuffer(t,0,u);let d=this.bindGroupLayout;if(!d)throw new a(`Shader pipelines not initialized`);let f=this.device.createBindGroup({label:`radix-bind-group-pass-${e}`,layout:d,entries:[{binding:0,resource:{buffer:i}},{binding:1,resource:{buffer:p}},{binding:2,resource:{buffer:_}},{binding:3,resource:{buffer:v}},{binding:4,resource:{buffer:t}}]});{let e=this.histogramPipeline;if(!e)throw new a(`Histogram pipeline not initialized`);let t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(e),n.setBindGroup(0,f),n.dispatchWorkgroups(o),n.end(),this.device.queue.submit([t.finish()])}this.scanModule.computePrefixSumGPU(_,v,y,n,s);{let e=this.scatterPipeline;if(!e)throw new a(`Scatter pipeline not initialized`);let t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(e),n.setBindGroup(0,f),n.dispatchWorkgroups(o),n.end(),this.device.queue.submit([t.finish()])}let m=i;i=p,p=m}await this.device.queue.onSubmittedWorkDone();let S=performance.now();b=await this.bufferManager.readBuffer(i,r*4),x=S-m}finally{d.releaseAll()}if(!b)throw Error(`Radix sort completed without producing output`);if(x===void 0)throw Error(`Radix sort completed without timing information`);let C=performance.now();if(t?.validate){let t=m.validate(e,b);if(!t.isValid)throw Error(`Sort validation failed: ${t.errors.join(`, `)}`)}return{sortedData:b,gpuTimeMs:x,totalTimeMs:C-n}}destroy(){this.clearPreallocation(),this.bufferManager.releaseAll(),this.scanModule.destroy(),this.histogramPipeline=null,this.scatterPipeline=null,this.bindGroupLayout=null,this.initialized=!1}},T=65536/Uint32Array.BYTES_PER_ELEMENT,E=4294967296;function D(e){if(typeof crypto<`u`&&typeof crypto.getRandomValues==`function`){for(let t=0;t<e.length;t+=T){let n=Math.min(T,e.length-t),r=new Uint32Array(n);crypto.getRandomValues(r),e.set(r,t)}return e}for(let t=0;t<e.length;t++)e[t]=Math.floor(Math.random()*E);return e}function O(e){return D(new Uint32Array(e))}var k=class e{context;bitonicSorter=null;radixSorter=null;constructor(e){this.context=e}static calculateSpeedup(e,t){return t<=0?0:e/t}static calculateAverage(e){return e.length===0?0:e.reduce((e,t)=>e+t,0)/e.length}static generateRandomData(e){return O(e)}runNativeSort(e){let t=new Uint32Array(e),n=performance.now();return t.sort(),performance.now()-n}async runSingle(t,n,r=5){let i=[],a=[];for(let o=0;o<r;o++){let r=e.generateRandomData(n);if(t===`js-native`){let e=this.runNativeSort(r);i.push(e)}else if(t===`bitonic`){this.bitonicSorter||=new v(this.context);let e=await this.bitonicSorter.sort(r);i.push(e.totalTimeMs),a.push(e.gpuTimeMs)}else if(t===`radix`){this.radixSorter||=new w(this.context);let e=await this.radixSorter.sort(r);i.push(e.totalTimeMs),a.push(e.gpuTimeMs)}}let o=e.calculateAverage(i);return{algorithm:t,arraySize:n,gpuTimeMs:a.length>0?e.calculateAverage(a):void 0,totalTimeMs:o,iterations:r}}async runAll(t=[...g]){let n=[];for(let r of t){let t=await this.runSingle(`js-native`,r);n.push(t);let i=await this.runSingle(`bitonic`,r);i.speedupVsNative=e.calculateSpeedup(t.totalTimeMs,i.totalTimeMs),n.push(i);let a=await this.runSingle(`radix`,r);a.speedupVsNative=e.calculateSpeedup(t.totalTimeMs,a.totalTimeMs),n.push(a)}return n}static formatResults(e){let t=[];t.push(`| Algorithm | Size | Total Time (ms) | GPU Time (ms) | Speedup |`),t.push(`|-----------|------|-----------------|---------------|---------|`);for(let n of e){let e=n.speedupVsNative?n.speedupVsNative.toFixed(2)+`x`:`-`,r=n.gpuTimeMs===void 0?`-`:n.gpuTimeMs.toFixed(2);t.push(`| ${n.algorithm.padEnd(9)} | ${n.arraySize.toString().padStart(7)} | ${n.totalTimeMs.toFixed(2).padStart(15)} | ${r.padStart(13)} | ${e.padStart(7)} |`)}return t.join(`
`)}destroy(){this.bitonicSorter&&=(this.bitonicSorter.destroy(),null),this.radixSorter&&=(this.radixSorter.destroy(),null)}},A=document.getElementById(`unsupported`),j=document.getElementById(`app`),M=document.getElementById(`algorithm`),N=document.getElementById(`arraySize`),P=document.getElementById(`iterations`),F=document.getElementById(`runBtn`),I=document.getElementById(`runAllBtn`),L=document.getElementById(`status`),R=document.getElementById(`statusText`),z=document.getElementById(`progressBar`),B=document.getElementById(`resultsCard`),V=document.getElementById(`resultsBody`),H=null,U=null;async function W(){if(!l.isSupported()){G();return}try{H=new l,await H.initialize({powerPreference:`high-performance`}),U=new k(H),te(),K(`Ready to run benchmarks`,`success`)}catch(e){G(),console.error(`Failed to initialize WebGPU:`,e)}}function G(){A.style.display=`block`,j.style.display=`none`}function K(e,t=`info`){L.classList.add(`visible`),L.classList.remove(`error`,`success`),t===`error`&&L.classList.add(`error`),t===`success`&&L.classList.add(`success`),R.textContent=e}function q(e){z.style.width=`${e}%`}function J(e){F.disabled=!e,I.disabled=!e}function Y(e){return e<1?`${(e*1e3).toFixed(2)} µs`:e<1e3?`${e.toFixed(2)} ms`:`${(e/1e3).toFixed(2)} s`}function X(e){return e>=1e6?`${(e/1e6).toFixed(1)}M`:e>=1e3?`${(e/1e3).toFixed(0)}K`:e.toString()}function Z(e,t){let n=document.createElement(`tr`),r=t&&e.algorithm!==`js-native`?t/e.totalTimeMs:e.speedupVsNative,i=r&&r>1?`fast`:`slow`,a=r?`${r.toFixed(2)}x`:`-`;n.innerHTML=`
    <td>${e.algorithm}</td>
    <td>${X(e.arraySize)}</td>
    <td>${Y(e.totalTimeMs)}</td>
    <td>${e.gpuTimeMs===void 0?`-`:Y(e.gpuTimeMs)}</td>
    <td class="speedup ${i}">${a}</td>
  `,V.appendChild(n),B.style.display=`block`}function Q(){V.innerHTML=``,B.style.display=`none`}async function $(){if(!U||!H)return;let e=M.value,t=parseInt(N.value),n=parseInt(P.value);J(!1),Q(),q(0);try{K(`Running JavaScript native sort (${X(t)} elements)...`),q(10);let r=await U.runSingle(`js-native`,t,n);if(Z(r),q(30),e===`bitonic`||e===`both`){K(`Running Bitonic Sort (${X(t)} elements)...`),Z(await U.runSingle(`bitonic`,t,n),r.totalTimeMs),q(e===`both`?60:90);let i=k.generateRandomData(Math.min(t,_)),a=new v(H),o=await a.sort(i),s=m.validate(i,o.sortedData);a.destroy(),s.isValid||console.warn(`Bitonic sort validation failed:`,s.errors)}if(e===`radix`||e===`both`){K(`Running Radix Sort (${X(t)} elements)...`),Z(await U.runSingle(`radix`,t,n),r.totalTimeMs),q(90);let e=k.generateRandomData(Math.min(t,_)),i=new w(H),a=await i.sort(e),o=m.validate(e,a.sortedData);i.destroy(),o.isValid||console.warn(`Radix sort validation failed:`,o.errors)}q(100),K(`Benchmark complete!`,`success`)}catch(e){K(`Error: ${e instanceof Error?e.message:String(e)}`,`error`),console.error(e)}finally{J(!0)}}async function ee(){if(!U)return;let e=[...g],t=parseInt(P.value);J(!1),Q(),q(0);try{let n=e.length*3,r=0;for(let i of e){K(`Running JS sort (${X(i)} elements)...`);let e=await U.runSingle(`js-native`,i,t);Z(e),r++,q(r/n*100),K(`Running Bitonic Sort (${X(i)} elements)...`),Z(await U.runSingle(`bitonic`,i,t),e.totalTimeMs),r++,q(r/n*100),K(`Running Radix Sort (${X(i)} elements)...`),Z(await U.runSingle(`radix`,i,t),e.totalTimeMs),r++,q(r/n*100)}K(`Full benchmark suite complete!`,`success`)}catch(e){K(`Error: ${e instanceof Error?e.message:String(e)}`,`error`),console.error(e)}finally{J(!0)}}function te(){F.addEventListener(`click`,$),I.addEventListener(`click`,ee)}W();