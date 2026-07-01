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
`,g=[1024,10240,102400,1048576],_=1e4,v=class e{device;bufferManager;localPipeline=null;globalPipeline=null;bindGroupLayout=null;initialized=!1;preallocatedBuffer=null;_preallocatedSize=0;constructor(e){this.device=e.getDevice(),this.bufferManager=new f(this.device)}get preallocatedSize(){return this._preallocatedSize}preallocate(t){this.clearPreallocation();let n=e.nextPowerOf2(t);this.preallocatedBuffer=this.device.createBuffer({label:`preallocated-bitonic-data`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),this._preallocatedSize=t}clearPreallocation(){this.preallocatedBuffer&&(this.preallocatedBuffer.destroy(),this.preallocatedBuffer=null,this._preallocatedSize=0)}static nextPowerOf2(e){if(e<=0)return 1;if(!(e&e-1))return e;let t=1;for(;t<e;)t*=2;return t}static isPowerOf2(e){return e>0&&(e&e-1)==0}async initializePipelines(){if(this.initialized)return;let e=this.device.createShaderModule({label:`bitonic-sort-shader`,code:h}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Bitonic shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.bindGroupLayout=this.device.createBindGroupLayout({label:`bitonic-bind-group-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]});let n=this.device.createPipelineLayout({label:`bitonic-pipeline-layout`,bindGroupLayouts:[this.bindGroupLayout]});this.localPipeline=this.device.createComputePipeline({label:`bitonic-local-pipeline`,layout:n,compute:{module:e,entryPoint:`bitonic_sort_local`}}),this.globalPipeline=this.device.createComputePipeline({label:`bitonic-global-pipeline`,layout:n,compute:{module:e,entryPoint:`bitonic_sort_global`}}),this.initialized=!0}async sort(t,n){let r=performance.now();await this.initializePipelines();let i=t.length;if(i<=1)return{sortedData:new Uint32Array(t),gpuTimeMs:0,totalTimeMs:performance.now()-r};let o=e.nextPowerOf2(i),s=new Uint32Array(o);s.set(t);for(let e=i;e<o;e++)s[e]=4294967295;let c=this.preallocatedBuffer,l=c!==null&&this._preallocatedSize>=i,u=new p,d,h,g;try{l?(this.device.queue.writeBuffer(c,0,s.buffer,s.byteOffset,s.byteLength),d=c):d=u.track(this.bufferManager.createStorageBuffer(s,`sort-data`),e=>this.bufferManager.releaseBuffer(e));let t=u.track(this.bufferManager.createUniformBuffer(16,`sort-uniforms`),e=>this.bufferManager.releaseBuffer(e)),n=this.bindGroupLayout;if(!n)throw new a(`Shader pipelines not initialized`);let r=this.device.createBindGroup({label:`bitonic-bind-group`,layout:n,entries:[{binding:0,resource:{buffer:d}},{binding:1,resource:{buffer:t}}]}),p=performance.now();if(!e.isPowerOf2(o))throw Error(`Invalid paddedSize: ${o} is not a power of 2`);let m=Math.ceil(o/256),_=Math.trunc(Math.log2(o)),v=Math.trunc(Math.log2(256)),y=this.localPipeline,b=this.globalPipeline;if(!y||!b)throw new a(`Sort pipelines not initialized`);let x=[{stage:0,passNum:0,isLocal:!0}];for(let e=v;e<_;e++)for(let t=e;t>=0;t--)x.push({stage:e,passNum:t,isLocal:!1});let S=new Uint32Array(x.length*4);for(let e=0;e<x.length;e++){let t=x[e];S[e*4]=t.stage,S[e*4+1]=t.passNum,S[e*4+2]=o,S[e*4+3]=0}let C=u.track(this.device.createBuffer({label:`bitonic-uniform-data`,size:f.alignSize(S.byteLength,4),usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}));this.device.queue.writeBuffer(C,0,S);let w=this.device.createCommandEncoder();for(let e=0;e<x.length;e++){w.copyBufferToBuffer(C,e*16,t,0,16);let n=w.beginComputePass();n.setPipeline(x[e].isLocal?y:b),n.setBindGroup(0,r),n.dispatchWorkgroups(m),n.end()}this.device.queue.submit([w.finish()]),await this.device.queue.onSubmittedWorkDone();let T=performance.now();h=(await this.bufferManager.readBuffer(d,o*4)).slice(0,i),g=T-p}finally{u.releaseAll()}if(!h)throw Error(`Bitonic sort completed without producing output`);if(g===void 0)throw Error(`Bitonic sort completed without timing information`);let _=performance.now();if(n?.validate){let e=m.validate(t,h);if(!e.isValid)throw Error(`Sort validation failed: ${e.errors.join(`, `)}`)}return{sortedData:h,gpuTimeMs:g,totalTimeMs:_-r}}destroy(){this.clearPreallocation(),this.bufferManager.releaseAll(),this.localPipeline=null,this.globalPipeline=null,this.bindGroupLayout=null,this.initialized=!1}},y=`// Blelloch Scan WGSL Compute Shaders
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
// Each thread handles 2 elements (matching blelloch_scan's 512 elements per workgroup)
@compute @workgroup_size(SCAN_WORKGROUP_SIZE)
fn add_block_prefixes(
  @builtin(local_invocation_id) local_id: vec3<u32>,
  @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
  let tid = local_id.x;
  let block_id = workgroup_id.x;
  let n = scan_uniforms.data_size;

  // Get the prefix for this block (sum of all previous blocks)
  let block_prefix = block_sums[block_id];

  // Add block prefix to each element in this block (2 elements per thread)
  let block_start = block_id * (SCAN_WORKGROUP_SIZE * 2u);
  let idx0 = block_start + tid;
  let idx1 = block_start + tid + SCAN_WORKGROUP_SIZE;

  if (idx0 < n) {
    scan_output[idx0] = scan_output[idx0] + block_prefix;
  }
  if (idx1 < n) {
    scan_output[idx1] = scan_output[idx1] + block_prefix;
  }
}`,b=256,x=b*2,S=x,C=class{device;bufferManager;blellochScanPipeline=null;scanBlockSumsPipeline=null;addBlockPrefixesPipeline=null;scanLayout=null;blockSumsScanLayout=null;addPrefixesLayout=null;initialized=!1;constructor(e){this.device=e.getDevice(),this.bufferManager=new f(this.device)}async initialize(){if(this.initialized)return;let e=this.device.createShaderModule({label:`scan-shader`,code:y}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Scan shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.scanLayout=this.device.createBindGroupLayout({label:`scan-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]}),this.blockSumsScanLayout=this.device.createBindGroupLayout({label:`block-sums-scan-layout`,entries:[{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]}),this.addPrefixesLayout=this.device.createBindGroupLayout({label:`add-prefixes-layout`,entries:[{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]}),this.blellochScanPipeline=this.device.createComputePipeline({label:`blelloch-scan-pipeline`,layout:this.device.createPipelineLayout({bindGroupLayouts:[this.scanLayout]}),compute:{module:e,entryPoint:`blelloch_scan`}}),this.scanBlockSumsPipeline=this.device.createComputePipeline({label:`scan-block-sums-pipeline`,layout:this.device.createPipelineLayout({bindGroupLayouts:[this.blockSumsScanLayout]}),compute:{module:e,entryPoint:`scan_block_sums`}}),this.addBlockPrefixesPipeline=this.device.createComputePipeline({label:`add-block-prefixes-pipeline`,layout:this.device.createPipelineLayout({bindGroupLayouts:[this.addPrefixesLayout]}),compute:{module:e,entryPoint:`add_block_prefixes`}}),this.initialized=!0}async computeExclusivePrefixSum(e){if(!this.initialized)throw new a(`ScanModule not initialized. Call initialize() first.`);let t=e.length;if(t===0)return new Uint32Array;if(t===1)return new Uint32Array([0]);let n=Math.ceil(t/x),r=new p;try{let i=r.track(this.bufferManager.createStorageBuffer(e,`scan-input`),e=>this.bufferManager.releaseBuffer(e)),a=r.track(this.device.createBuffer({label:`scan-output`,size:f.alignSize(t*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),o=r.track(this.device.createBuffer({label:`scan-block-sums`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),s=r.track(this.bufferManager.createUniformBuffer(16,`scan-uniforms`),e=>this.bufferManager.releaseBuffer(e));return this.computePrefixSumGPU(i,a,o,s,t),await this.device.queue.onSubmittedWorkDone(),await this.bufferManager.readBuffer(a,t*4)}finally{r.releaseAll()}}computePrefixSumGPU(e,t,n,r,i){let o=this.scanLayout,s=this.blellochScanPipeline,c=this.addBlockPrefixesPipeline,l=this.addPrefixesLayout;if(!o||!s||!c||!l)throw new a(`Scan pipelines not initialized`);let u=Math.ceil(i/x);this.writeUniform(r,i,u);{let i=this.device.createBindGroup({label:`blelloch-scan-bind-group`,layout:o,entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:n}},{binding:3,resource:{buffer:r}}]}),a=this.device.createCommandEncoder(),c=a.beginComputePass();c.setPipeline(s),c.setBindGroup(0,i),c.dispatchWorkgroups(u),c.end(),this.device.queue.submit([a.finish()])}if(u>1){this.scanBlockSumsRecursive(n,u,r),this.writeUniform(r,i,u);{let e=this.device.createBindGroup({label:`add-block-prefixes-bind-group`,layout:l,entries:[{binding:1,resource:{buffer:t}},{binding:2,resource:{buffer:n}},{binding:3,resource:{buffer:r}}]}),i=this.device.createCommandEncoder(),a=i.beginComputePass();a.setPipeline(c),a.setBindGroup(0,e),a.dispatchWorkgroups(u),a.end(),this.device.queue.submit([i.finish()])}}}scanBlockSumsRecursive(e,t,n){let r=this.scanBlockSumsPipeline,i=this.scanLayout,o=this.addBlockPrefixesPipeline,s=this.blockSumsScanLayout,c=this.addPrefixesLayout,l=this.blellochScanPipeline;if(!r||!i||!o||!s||!c||!l)throw new a(`Scan pipelines not initialized`);if(t<=S){this.writeUniform(n,t,t);let i=this.device.createBindGroup({label:`scan-block-sums-bind-group`,layout:s,entries:[{binding:2,resource:{buffer:e}},{binding:3,resource:{buffer:n}}]}),a=this.device.createCommandEncoder(),o=a.beginComputePass();o.setPipeline(r),o.setBindGroup(0,i),o.dispatchWorkgroups(1),o.end(),this.device.queue.submit([a.finish()]);return}let u=Math.ceil(t/x),d=this.device.createBuffer({label:`scan-recursive-temp-output`,size:f.alignSize(t*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),p=this.device.createBuffer({label:`scan-recursive-temp-block-sums`,size:f.alignSize(u*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});this.writeUniform(n,t,u);{let t=this.device.createBindGroup({label:`recursive-blelloch-scan-bind-group`,layout:i,entries:[{binding:0,resource:{buffer:e}},{binding:1,resource:{buffer:d}},{binding:2,resource:{buffer:p}},{binding:3,resource:{buffer:n}}]}),r=this.device.createCommandEncoder(),a=r.beginComputePass();a.setPipeline(l),a.setBindGroup(0,t),a.dispatchWorkgroups(u),a.end(),this.device.queue.submit([r.finish()])}this.scanBlockSumsRecursive(p,u,n),this.writeUniform(n,t,u);{let e=this.device.createBindGroup({label:`recursive-add-prefixes-bind-group`,layout:c,entries:[{binding:1,resource:{buffer:d}},{binding:2,resource:{buffer:p}},{binding:3,resource:{buffer:n}}]}),t=this.device.createCommandEncoder(),r=t.beginComputePass();r.setPipeline(o),r.setBindGroup(0,e),r.dispatchWorkgroups(u),r.end(),this.device.queue.submit([t.finish()])}{let n=this.device.createCommandEncoder();n.copyBufferToBuffer(d,0,e,0,f.alignSize(t*4,4)),this.device.queue.submit([n.finish()])}d.destroy(),p.destroy()}writeUniform(e,t,n){let r=new Uint32Array([t,n,0,0]);this.device.queue.writeBuffer(e,0,r)}static getConstants(){return{scanWorkgroupSize:b,elementsPerScanBlock:x}}destroy(){this.bufferManager.releaseAll(),this.blellochScanPipeline=null,this.scanBlockSumsPipeline=null,this.addBlockPrefixesPipeline=null,this.scanLayout=null,this.blockSumsScanLayout=null,this.addPrefixesLayout=null,this.initialized=!1}},w=`// Radix Sort WGSL Compute Shaders
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
`,T=class{device;bufferManager;scanModule;histogramPipeline=null;scatterPipeline=null;bindGroupLayout=null;preallocatedBuffers=null;_preallocatedSize=0;initialized=!1;constructor(e){this.device=e.getDevice(),this.bufferManager=new f(this.device),this.scanModule=new C(e)}get preallocatedSize(){return this._preallocatedSize}preallocate(e){this.clearPreallocation();let{elementsPerScanBlock:t}=C.getConstants(),n=16*Math.ceil(e/256),r=Math.ceil(n/t);this.preallocatedBuffers={input:this.device.createBuffer({label:`preallocated-radix-input`,size:f.alignSize(e*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),output:this.device.createBuffer({label:`preallocated-radix-output`,size:f.alignSize(e*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),histogram:this.device.createBuffer({label:`preallocated-radix-histogram`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),prefixSum:this.device.createBuffer({label:`preallocated-radix-prefix-sum`,size:f.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),blockSums:this.device.createBuffer({label:`preallocated-radix-block-sums`,size:f.alignSize(r*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})},this._preallocatedSize=e}clearPreallocation(){this.preallocatedBuffers&&(this.preallocatedBuffers.input.destroy(),this.preallocatedBuffers.output.destroy(),this.preallocatedBuffers.histogram.destroy(),this.preallocatedBuffers.prefixSum.destroy(),this.preallocatedBuffers.blockSums.destroy(),this.preallocatedBuffers=null,this._preallocatedSize=0)}async initializePipelines(){if(this.initialized)return;let e=this.device.createShaderModule({label:`radix-sort-shader`,code:w}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Radix shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.bindGroupLayout=this.device.createBindGroupLayout({label:`radix-bind-group-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]});let n=this.device.createPipelineLayout({label:`radix-pipeline-layout`,bindGroupLayouts:[this.bindGroupLayout]});this.histogramPipeline=this.device.createComputePipeline({label:`radix-histogram-pipeline`,layout:n,compute:{module:e,entryPoint:`compute_histogram`}}),this.scatterPipeline=this.device.createComputePipeline({label:`radix-scatter-pipeline`,layout:n,compute:{module:e,entryPoint:`scatter`}}),await this.scanModule.initialize(),this.initialized=!0}async sort(e,t){let n=performance.now();await this.initializePipelines();let r=e.length;if(r<=1)return{sortedData:new Uint32Array(e),gpuTimeMs:0,totalTimeMs:performance.now()-n};let{elementsPerScanBlock:i}=C.getConstants(),o=Math.ceil(r/256),s=16*o,c=Math.ceil(s/i),l=this.preallocatedBuffers,u=l!==null&&this._preallocatedSize>=r,d=new p,h,g,_,v,y,b,x;try{let t,n;u?(this.device.queue.writeBuffer(l.input,0,e.buffer,e.byteOffset,e.byteLength),h=l.input,g=l.output,_=l.histogram,v=l.prefixSum,y=l.blockSums,t=d.track(this.bufferManager.createUniformBuffer(16,`radix-uniforms`),e=>this.bufferManager.releaseBuffer(e)),n=d.track(this.bufferManager.createUniformBuffer(16,`scan-uniforms`),e=>this.bufferManager.releaseBuffer(e))):(h=d.track(this.bufferManager.createStorageBuffer(e,`radix-input`),e=>this.bufferManager.releaseBuffer(e)),g=d.track(this.device.createBuffer({label:`radix-output`,size:f.alignSize(r*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),_=d.track(this.device.createBuffer({label:`radix-histogram`,size:f.alignSize(s*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),v=d.track(this.device.createBuffer({label:`radix-prefix-sum`,size:f.alignSize(s*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),y=d.track(this.device.createBuffer({label:`radix-block-sums`,size:f.alignSize(c*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})),t=d.track(this.bufferManager.createUniformBuffer(16,`radix-uniforms`),e=>this.bufferManager.releaseBuffer(e)),n=d.track(this.bufferManager.createUniformBuffer(16,`scan-uniforms`),e=>this.bufferManager.releaseBuffer(e)));let i=h,p=g,m=performance.now(),S=new Uint32Array(s);for(let e=0;e<8;e++){let c=e*4;this.device.queue.writeBuffer(_,0,S);let l=new Uint32Array([c,r,o,0]);this.device.queue.writeBuffer(t,0,l);let u=this.bindGroupLayout;if(!u)throw new a(`Shader pipelines not initialized`);let d=this.device.createBindGroup({label:`radix-bind-group-pass-${e}`,layout:u,entries:[{binding:0,resource:{buffer:i}},{binding:1,resource:{buffer:p}},{binding:2,resource:{buffer:_}},{binding:3,resource:{buffer:v}},{binding:4,resource:{buffer:t}}]});{let e=this.histogramPipeline;if(!e)throw new a(`Histogram pipeline not initialized`);let t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(e),n.setBindGroup(0,d),n.dispatchWorkgroups(o),n.end(),this.device.queue.submit([t.finish()])}this.scanModule.computePrefixSumGPU(_,v,y,n,s);{let e=this.scatterPipeline;if(!e)throw new a(`Scatter pipeline not initialized`);let t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(e),n.setBindGroup(0,d),n.dispatchWorkgroups(o),n.end(),this.device.queue.submit([t.finish()])}let f=i;i=p,p=f}await this.device.queue.onSubmittedWorkDone();let C=performance.now();b=await this.bufferManager.readBuffer(i,r*4),x=C-m}finally{d.releaseAll()}if(!b)throw Error(`Radix sort completed without producing output`);if(x===void 0)throw Error(`Radix sort completed without timing information`);let S=performance.now();if(t?.validate){let t=m.validate(e,b);if(!t.isValid)throw Error(`Sort validation failed: ${t.errors.join(`, `)}`)}return{sortedData:b,gpuTimeMs:x,totalTimeMs:S-n}}destroy(){this.clearPreallocation(),this.bufferManager.releaseAll(),this.scanModule.destroy(),this.histogramPipeline=null,this.scatterPipeline=null,this.bindGroupLayout=null,this.initialized=!1}},E=65536/Uint32Array.BYTES_PER_ELEMENT,D=4294967296;function O(e){if(typeof crypto<`u`&&typeof crypto.getRandomValues==`function`){for(let t=0;t<e.length;t+=E){let n=Math.min(E,e.length-t);crypto.getRandomValues(e.subarray(t,t+n))}return e}for(let t=0;t<e.length;t++)e[t]=Math.floor(Math.random()*D);return e}function k(e){return O(new Uint32Array(e))}var A=class e{context;bitonicSorter=null;radixSorter=null;constructor(e){this.context=e}static calculateSpeedup(e,t){return t<=0?0:e/t}static calculateAverage(e){return e.length===0?0:e.reduce((e,t)=>e+t,0)/e.length}static generateRandomData(e){return k(e)}runNativeSort(e){let t=new Uint32Array(e),n=performance.now();return t.sort(),performance.now()-n}async runSingle(t,n,r=5){let i=[],a=[],o=null;t===`bitonic`?(this.bitonicSorter||=new v(this.context),o=this.bitonicSorter,this.bitonicSorter.preallocate(n)):t===`radix`&&(this.radixSorter||=new T(this.context),o=this.radixSorter,this.radixSorter.preallocate(n));for(let s=0;s<r;s++){let r=e.generateRandomData(n);if(t===`js-native`){let e=this.runNativeSort(r);i.push(e)}else if(o){let e=await o.sort(r);i.push(e.totalTimeMs),a.push(e.gpuTimeMs)}}let s=e.calculateAverage(i);return{algorithm:t,arraySize:n,gpuTimeMs:a.length>0?e.calculateAverage(a):void 0,totalTimeMs:s,iterations:r}}async runAll(t=[...g]){let n=[];for(let r of t){let t=await this.runSingle(`js-native`,r);n.push(t);let i=await this.runSingle(`bitonic`,r);i.speedupVsNative=e.calculateSpeedup(t.totalTimeMs,i.totalTimeMs),n.push(i);let a=await this.runSingle(`radix`,r);a.speedupVsNative=e.calculateSpeedup(t.totalTimeMs,a.totalTimeMs),n.push(a)}return n}static formatResults(e){let t=[];t.push(`| Algorithm | Size | Total Time (ms) | GPU Time (ms) | Speedup |`),t.push(`|-----------|------|-----------------|---------------|---------|`);for(let n of e){let e=n.speedupVsNative?n.speedupVsNative.toFixed(2)+`x`:`-`,r=n.gpuTimeMs===void 0?`-`:n.gpuTimeMs.toFixed(2);t.push(`| ${n.algorithm.padEnd(9)} | ${n.arraySize.toString().padStart(7)} | ${n.totalTimeMs.toFixed(2).padStart(15)} | ${r.padStart(13)} | ${e.padStart(7)} |`)}return t.join(`
`)}destroy(){this.bitonicSorter&&=(this.bitonicSorter.destroy(),null),this.radixSorter&&=(this.radixSorter.destroy(),null)}},j=document.getElementById(`unsupported`),M=document.getElementById(`app`),N=document.getElementById(`algorithm`),P=document.getElementById(`arraySize`),F=document.getElementById(`iterations`),I=document.getElementById(`runBtn`),L=document.getElementById(`runAllBtn`),R=document.getElementById(`status`),z=document.getElementById(`statusText`),B=document.getElementById(`progressBar`),V=document.getElementById(`resultsCard`),H=document.getElementById(`resultsBody`),U=null,W=null;async function G(){if(!l.isSupported()){K();return}try{U=new l,await U.initialize({powerPreference:`high-performance`}),W=new A(U),ne(),q(`Ready to run benchmarks`,`success`)}catch(e){K(),console.error(`Failed to initialize WebGPU:`,e)}}function K(){j.style.display=`block`,M.style.display=`none`}function q(e,t=`info`){R.classList.add(`visible`),R.classList.remove(`error`,`success`),t===`error`&&R.classList.add(`error`),t===`success`&&R.classList.add(`success`),z.textContent=e}function J(e){B.style.width=`${e}%`}function Y(e){I.disabled=!e,L.disabled=!e}function X(e){return e<1?`${(e*1e3).toFixed(2)} µs`:e<1e3?`${e.toFixed(2)} ms`:`${(e/1e3).toFixed(2)} s`}function Z(e){return e>=1e6?`${(e/1e6).toFixed(1)}M`:e>=1e3?`${(e/1e3).toFixed(0)}K`:e.toString()}function Q(e,t){let n=document.createElement(`tr`),r=t&&e.algorithm!==`js-native`?t/e.totalTimeMs:e.speedupVsNative,i=r&&r>1?`fast`:`slow`,a=r?`${r.toFixed(2)}x`:`-`;n.innerHTML=`
    <td>${e.algorithm}</td>
    <td>${Z(e.arraySize)}</td>
    <td>${X(e.totalTimeMs)}</td>
    <td>${e.gpuTimeMs===void 0?`-`:X(e.gpuTimeMs)}</td>
    <td class="speedup ${i}">${a}</td>
  `,H.appendChild(n),V.style.display=`block`}function $(){H.innerHTML=``,V.style.display=`none`}async function ee(){if(!W||!U)return;let e=N.value,t=parseInt(P.value),n=parseInt(F.value);Y(!1),$(),J(0);try{q(`Running JavaScript native sort (${Z(t)} elements)...`),J(10);let r=await W.runSingle(`js-native`,t,n);if(Q(r),J(30),e===`bitonic`||e===`both`){q(`Running Bitonic Sort (${Z(t)} elements)...`),Q(await W.runSingle(`bitonic`,t,n),r.totalTimeMs),J(e===`both`?60:90);let i=A.generateRandomData(Math.min(t,_)),a=new v(U),o=await a.sort(i),s=m.validate(i,o.sortedData);a.destroy(),s.isValid||console.warn(`Bitonic sort validation failed:`,s.errors)}if(e===`radix`||e===`both`){q(`Running Radix Sort (${Z(t)} elements)...`),Q(await W.runSingle(`radix`,t,n),r.totalTimeMs),J(90);let e=A.generateRandomData(Math.min(t,_)),i=new T(U),a=await i.sort(e),o=m.validate(e,a.sortedData);i.destroy(),o.isValid||console.warn(`Radix sort validation failed:`,o.errors)}J(100),q(`Benchmark complete!`,`success`)}catch(e){q(`Error: ${e instanceof Error?e.message:String(e)}`,`error`),console.error(e)}finally{Y(!0)}}async function te(){if(!W)return;let e=[...g],t=parseInt(F.value);Y(!1),$(),J(0);try{let n=e.length*3,r=0;for(let i of e){q(`Running JS sort (${Z(i)} elements)...`);let e=await W.runSingle(`js-native`,i,t);Q(e),r++,J(r/n*100),q(`Running Bitonic Sort (${Z(i)} elements)...`),Q(await W.runSingle(`bitonic`,i,t),e.totalTimeMs),r++,J(r/n*100),q(`Running Radix Sort (${Z(i)} elements)...`),Q(await W.runSingle(`radix`,i,t),e.totalTimeMs),r++,J(r/n*100)}q(`Full benchmark suite complete!`,`success`)}catch(e){q(`Error: ${e instanceof Error?e.message:String(e)}`,`error`),console.error(e)}finally{Y(!0)}}function ne(){I.addEventListener(`click`,ee),L.addEventListener(`click`,te)}G();