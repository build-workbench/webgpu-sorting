(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class extends Error{constructor(e=`WebGPU is not supported in this browser`){super(e),this.name=`WebGPUNotSupportedError`}},t=class extends Error{constructor(e=`Failed to get GPU adapter`){super(e),this.name=`GPUAdapterError`}},n=class extends Error{constructor(e=`Failed to get GPU device`){super(e),this.name=`GPUDeviceError`}},r=class extends Error{constructor(e=`Failed to allocate GPU buffer`){super(e),this.name=`BufferAllocationError`}},i=class extends Error{constructor(e=`Failed to map GPU buffer`){super(e),this.name=`BufferMapError`}},a=class extends Error{constructor(e=`Failed to compile shader`){super(e),this.name=`ShaderCompilationError`}},o=class r{adapter=null;device=null;initialized=!1;deviceLossCallbacks=new Set;limitsInfo=null;static isSupported(){return typeof navigator<`u`&&`gpu`in navigator}onDeviceLoss(e){return this.deviceLossCallbacks.add(e),()=>{this.deviceLossCallbacks.delete(e)}}async recover(e){this.initialized=!1,this.device=null,this.adapter=null,this.limitsInfo=null,await this.initialize(e)}getLimitsInfo(){if(!this.limitsInfo)throw new n(`GPUContext not initialized. Call initialize() first.`);return this.limitsInfo}async initialize(i){if(this.initialized)return;if(!r.isSupported())throw new e;if(this.adapter=await navigator.gpu.requestAdapter({powerPreference:i?.powerPreference??`high-performance`}),!this.adapter)throw new t;let a=this.adapter.limits;this.limitsInfo={maxStorageBufferBindingSize:a.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:a.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:a.maxComputeWorkgroupSizeX,maxBufferSize:a.maxBufferSize};let o={maxStorageBufferBindingSize:Math.min(a.maxStorageBufferBindingSize,i?.requiredLimits?.maxStorageBufferBindingSize??a.maxStorageBufferBindingSize),maxBufferSize:Math.min(a.maxBufferSize,i?.requiredLimits?.maxBufferSize??a.maxBufferSize)};if(this.device=await this.adapter.requestDevice({requiredFeatures:[],requiredLimits:o}),!this.device)throw new n;this.device.lost.then(e=>{console.error(`GPU device lost:`,e.message),this.initialized=!1,this.device=null;for(let t of this.deviceLossCallbacks)try{t(e)}catch(e){console.error(`Error in device loss callback:`,e)}}),this.initialized=!0}getDevice(){if(!this.device)throw new n(`GPUContext not initialized. Call initialize() first.`);return this.device}getAdapter(){if(!this.adapter)throw new t(`GPUContext not initialized. Call initialize() first.`);return this.adapter}isInitialized(){return this.initialized}destroy(){this.deviceLossCallbacks.clear(),this.device&&=(this.device.destroy(),null),this.adapter=null,this.limitsInfo=null,this.initialized=!1}};function s(e){return e instanceof Error?e.message:String(e)}var c=class e{device;buffers=new Set;constructor(e){this.device=e}static alignSize(e,t){if(t<=0)throw Error(`Alignment must be positive`);return Math.ceil(e/t)*t}createStorageBuffer(t,n){let i=e.alignSize(t.byteLength,4);try{let e=this.device.createBuffer({label:n??`storage-buffer`,size:i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,mappedAtCreation:!0});return new Uint32Array(e.getMappedRange()).set(t),e.unmap(),this.buffers.add(e),e}catch(e){throw new r(`Failed to create storage buffer: ${s(e)}`)}}createStagingBuffer(t){let n=e.alignSize(t,4);try{let e=this.device.createBuffer({label:`staging-buffer`,size:n,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});return this.buffers.add(e),e}catch(e){throw new r(`Failed to create staging buffer: ${s(e)}`)}}createUniformBuffer(t,n){let i=e.alignSize(t,16);try{let e=this.device.createBuffer({label:n??`uniform-buffer`,size:i,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return this.buffers.add(e),e}catch(e){throw new r(`Failed to create uniform buffer: ${s(e)}`)}}async readBuffer(t,n){let r=e.alignSize(n,4),a=this.createStagingBuffer(r),o=this.device.createCommandEncoder();o.copyBufferToBuffer(t,0,a,0,r),this.device.queue.submit([o.finish()]);try{await a.mapAsync(GPUMapMode.READ);let e=a.getMappedRange(),t=new Uint32Array(e.slice(0,n));return a.unmap(),this.releaseBuffer(a),t}catch(e){throw this.releaseBuffer(a),new i(`Failed to read buffer: ${s(e)}`)}}writeBuffer(e,t,n=0){this.device.queue.writeBuffer(e,n,t.buffer,t.byteOffset,t.byteLength)}releaseBuffer(e){this.buffers.has(e)&&(e.destroy(),this.buffers.delete(e))}releaseAll(){for(let e of this.buffers)e.destroy();this.buffers.clear()}getBufferCount(){return this.buffers.size}},l=`// Bitonic Sort WGSL Compute Shader
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
`,u=[1024,10240,102400,1048576],d=1e4,f=class e{device;bufferManager;localPipeline=null;globalPipeline=null;bindGroupLayout=null;initialized=!1;constructor(e){this.device=e.getDevice(),this.bufferManager=new c(this.device)}static nextPowerOf2(e){if(e<=0)return 1;if(!(e&e-1))return e;let t=1;for(;t<e;)t*=2;return t}static isPowerOf2(e){return e>0&&(e&e-1)==0}async initializePipelines(){if(this.initialized)return;let e=this.device.createShaderModule({label:`bitonic-sort-shader`,code:l}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Bitonic shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.bindGroupLayout=this.device.createBindGroupLayout({label:`bitonic-bind-group-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]});let n=this.device.createPipelineLayout({label:`bitonic-pipeline-layout`,bindGroupLayouts:[this.bindGroupLayout]});this.localPipeline=this.device.createComputePipeline({label:`bitonic-local-pipeline`,layout:n,compute:{module:e,entryPoint:`bitonic_sort_local`}}),this.globalPipeline=this.device.createComputePipeline({label:`bitonic-global-pipeline`,layout:n,compute:{module:e,entryPoint:`bitonic_sort_global`}}),this.initialized=!0}async sort(t){let n=performance.now();await this.initializePipelines();let r=t.length;if(r<=1)return{sortedData:new Uint32Array(t),gpuTimeMs:0,totalTimeMs:performance.now()-n};let i=e.nextPowerOf2(r),o=new Uint32Array(i);o.set(t);for(let e=r;e<i;e++)o[e]=4294967295;let s=this.bufferManager.createStorageBuffer(o,`sort-data`),c=this.bufferManager.createUniformBuffer(16,`sort-uniforms`),l=this.bindGroupLayout;if(!l)throw new a(`Shader pipelines not initialized`);let u=this.device.createBindGroup({label:`bitonic-bind-group`,layout:l,entries:[{binding:0,resource:{buffer:s}},{binding:1,resource:{buffer:c}}]}),d=performance.now();if(!e.isPowerOf2(i))throw Error(`Invalid paddedSize: ${i} is not a power of 2`);let f=Math.ceil(i/256),p=Math.trunc(Math.log2(i));{let e=this.localPipeline;if(!e)throw new a(`Local pipeline not initialized`);let t=new Uint32Array([0,0,i,0]);this.device.queue.writeBuffer(c,0,t);let n=this.device.createCommandEncoder(),r=n.beginComputePass();r.setPipeline(e),r.setBindGroup(0,u),r.dispatchWorkgroups(f),r.end(),this.device.queue.submit([n.finish()])}let m=Math.trunc(Math.log2(256)),h=this.globalPipeline;if(!h)throw new a(`Global pipeline not initialized`);for(let e=m;e<p;e++)for(let t=e;t>=0;t--){let n=new Uint32Array([e,t,i,0]);this.device.queue.writeBuffer(c,0,n);let r=this.device.createCommandEncoder(),a=r.beginComputePass();a.setPipeline(h),a.setBindGroup(0,u),a.dispatchWorkgroups(f),a.end(),this.device.queue.submit([r.finish()])}await this.device.queue.onSubmittedWorkDone();let g=performance.now(),_=(await this.bufferManager.readBuffer(s,i*4)).slice(0,r);this.bufferManager.releaseBuffer(s),this.bufferManager.releaseBuffer(c);let v=performance.now();return{sortedData:_,gpuTimeMs:g-d,totalTimeMs:v-n}}destroy(){this.bufferManager.releaseAll(),this.localPipeline=null,this.globalPipeline=null,this.bindGroupLayout=null,this.initialized=!1}},p=`// Radix Sort WGSL Compute Shaders
// Implements 4-bit radix sort with histogram, prefix sum, and scatter
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
`,m=class{device;bufferManager;histogramPipeline=null;scatterPipeline=null;bindGroupLayout=null;initialized=!1;constructor(e){this.device=e.getDevice(),this.bufferManager=new c(this.device)}async initializePipelines(){if(this.initialized)return;let e=this.device.createShaderModule({label:`radix-sort-shader`,code:p}),t=(await e.getCompilationInfo()).messages.filter(e=>e.type===`error`);if(t.length>0)throw new a(`Radix shader compilation failed: ${t.map(e=>e.message).join(`, `)}`);this.bindGroupLayout=this.device.createBindGroupLayout({label:`radix-bind-group-layout`,entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:`read-only-storage`}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:`storage`}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:`uniform`}}]});let n=this.device.createPipelineLayout({label:`radix-pipeline-layout`,bindGroupLayouts:[this.bindGroupLayout]});this.histogramPipeline=this.device.createComputePipeline({label:`radix-histogram-pipeline`,layout:n,compute:{module:e,entryPoint:`compute_histogram`}}),this.scatterPipeline=this.device.createComputePipeline({label:`radix-scatter-pipeline`,layout:n,compute:{module:e,entryPoint:`scatter`}}),this.initialized=!0}computePrefixSum(e){let t=new Uint32Array(e.length),n=0;for(let r=0;r<e.length;r++)t[r]=n,n+=e[r];return t}async sort(e){let t=performance.now();await this.initializePipelines();let n=e.length;if(n<=1)return{sortedData:new Uint32Array(e),gpuTimeMs:0,totalTimeMs:performance.now()-t};let r=Math.ceil(n/256),i=16*r,o=this.bufferManager.createStorageBuffer(e,`radix-input`),s=this.device.createBuffer({label:`radix-output`,size:c.alignSize(n*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),l=this.device.createBuffer({label:`radix-histogram`,size:c.alignSize(i*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),u=this.device.createBuffer({label:`radix-prefix-sum`,size:c.alignSize(i*4,4),usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),d=this.bufferManager.createUniformBuffer(16,`radix-uniforms`),f=o,p=s,m=()=>{o.destroy(),s.destroy(),l.destroy(),u.destroy(),this.bufferManager.releaseBuffer(d)};try{let e=performance.now();for(let e=0;e<8;e++){let t=e*4,o=new Uint32Array(i);this.device.queue.writeBuffer(l,0,o);let s=new Uint32Array([t,n,r,0]);this.device.queue.writeBuffer(d,0,s);let m=this.bindGroupLayout;if(!m)throw new a(`Shader pipelines not initialized`);let h=this.device.createBindGroup({label:`radix-bind-group-pass-${e}`,layout:m,entries:[{binding:0,resource:{buffer:f}},{binding:1,resource:{buffer:p}},{binding:2,resource:{buffer:l}},{binding:3,resource:{buffer:u}},{binding:4,resource:{buffer:d}}]});{let e=this.histogramPipeline;if(!e)throw new a(`Histogram pipeline not initialized`);let t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(e),n.setBindGroup(0,h),n.dispatchWorkgroups(r),n.end(),this.device.queue.submit([t.finish()])}await this.device.queue.onSubmittedWorkDone();let g=this.device.createBuffer({size:c.alignSize(i*4,4),usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});try{{let e=this.device.createCommandEncoder();e.copyBufferToBuffer(l,0,g,0,i*4),this.device.queue.submit([e.finish()])}await g.mapAsync(GPUMapMode.READ);let e=new Uint32Array(g.getMappedRange().slice(0));g.unmap();let t=this.computePrefixSum(e);this.device.queue.writeBuffer(u,0,t.buffer,t.byteOffset,t.byteLength)}finally{g.destroy()}{let e=this.scatterPipeline;if(!e)throw new a(`Scatter pipeline not initialized`);let t=this.device.createCommandEncoder(),n=t.beginComputePass();n.setPipeline(e),n.setBindGroup(0,h),n.dispatchWorkgroups(r),n.end(),this.device.queue.submit([t.finish()])}let _=f;f=p,p=_}await this.device.queue.onSubmittedWorkDone();let o=performance.now(),s=await this.bufferManager.readBuffer(f,n*4),m=performance.now();return{sortedData:s,gpuTimeMs:o-e,totalTimeMs:m-t}}finally{m()}}destroy(){this.bufferManager.releaseAll(),this.histogramPipeline=null,this.scatterPipeline=null,this.bindGroupLayout=null,this.initialized=!1}},h=class e{context;bitonicSorter=null;radixSorter=null;constructor(e){this.context=e}static calculateSpeedup(e,t){return t<=0?0:e/t}static calculateAverage(e){return e.length===0?0:e.reduce((e,t)=>e+t,0)/e.length}static generateRandomData(e){let t=new Uint32Array(e);if(typeof crypto<`u`&&crypto.getRandomValues)crypto.getRandomValues(t);else for(let n=0;n<e;n++)t[n]=Math.floor(Math.random()*4294967295);return t}runNativeSort(e){let t=new Uint32Array(e),n=performance.now();return t.sort(),performance.now()-n}async runSingle(t,n,r=5){let i=[],a=[];for(let o=0;o<r;o++){let r=e.generateRandomData(n);if(t===`js-native`){let e=this.runNativeSort(r);i.push(e)}else if(t===`bitonic`){this.bitonicSorter||=new f(this.context);let e=await this.bitonicSorter.sort(r);i.push(e.totalTimeMs),a.push(e.gpuTimeMs)}else if(t===`radix`){this.radixSorter||=new m(this.context);let e=await this.radixSorter.sort(r);i.push(e.totalTimeMs),a.push(e.gpuTimeMs)}}let o=e.calculateAverage(i);return{algorithm:t,arraySize:n,gpuTimeMs:a.length>0?e.calculateAverage(a):void 0,totalTimeMs:o,iterations:r}}async runAll(t=[...u]){let n=[];for(let r of t){let t=await this.runSingle(`js-native`,r);n.push(t);let i=await this.runSingle(`bitonic`,r);i.speedupVsNative=e.calculateSpeedup(t.totalTimeMs,i.totalTimeMs),n.push(i);let a=await this.runSingle(`radix`,r);a.speedupVsNative=e.calculateSpeedup(t.totalTimeMs,a.totalTimeMs),n.push(a)}return n}static formatResults(e){let t=[];t.push(`| Algorithm | Size | Total Time (ms) | GPU Time (ms) | Speedup |`),t.push(`|-----------|------|-----------------|---------------|---------|`);for(let n of e){let e=n.speedupVsNative?n.speedupVsNative.toFixed(2)+`x`:`-`,r=n.gpuTimeMs===void 0?`-`:n.gpuTimeMs.toFixed(2);t.push(`| ${n.algorithm.padEnd(9)} | ${n.arraySize.toString().padStart(7)} | ${n.totalTimeMs.toFixed(2).padStart(15)} | ${r.padStart(13)} | ${e.padStart(7)} |`)}return t.join(`
`)}destroy(){this.bitonicSorter&&=(this.bitonicSorter.destroy(),null),this.radixSorter&&=(this.radixSorter.destroy(),null)}},g=class e{static isSorted(e){if(e.length<=1)return!0;for(let t=0;t<e.length-1;t++)if(e[t]>e[t+1])return!1;return!0}static hasSameElements(e,t){if(e.length!==t.length)return!1;if(e.length===0)return!0;let n=new Map,r=new Map;for(let i=0;i<e.length;i++)n.set(e[i],(n.get(e[i])??0)+1),r.set(t[i],(r.get(t[i])??0)+1);if(n.size!==r.size)return!1;for(let[e,t]of n)if(r.get(e)!==t)return!1;return!0}static validate(t,n){let r=[],i=e.isSorted(n);i||r.push(`Output array is not sorted in ascending order`);let a=e.hasSameElements(t,n);return a||r.push(`Output array does not contain the same elements as input`),{isValid:i&&a,isSorted:i,hasAllElements:a,errors:r}}static compareWithNativeSort(t,n){let r=new Uint32Array(t);r.sort();let i=[],a=!0;if(n.length!==r.length)a=!1,i.push(`Length mismatch: GPU=${n.length}, Native=${r.length}`);else for(let e=0;e<n.length;e++)if(n[e]!==r[e]&&(a=!1,i.push(`Mismatch at index ${e}: GPU=${n[e]}, Native=${r[e]}`),i.length>=5)){i.push(`... (more mismatches not shown)`);break}return{isValid:a,isSorted:e.isSorted(n),hasAllElements:e.hasSameElements(t,n),errors:i}}},_=document.getElementById(`unsupported`),v=document.getElementById(`app`),y=document.getElementById(`algorithm`),b=document.getElementById(`arraySize`),x=document.getElementById(`iterations`),S=document.getElementById(`runBtn`),C=document.getElementById(`runAllBtn`),w=document.getElementById(`status`),T=document.getElementById(`statusText`),E=document.getElementById(`progressBar`),D=document.getElementById(`resultsCard`),O=document.getElementById(`resultsBody`),k=null,A=null;async function j(){if(!o.isSupported()){M();return}try{k=new o,await k.initialize({powerPreference:`high-performance`}),A=new h(k),H(),N(`Ready to run benchmarks`,`success`)}catch(e){M(),console.error(`Failed to initialize WebGPU:`,e)}}function M(){_.style.display=`block`,v.style.display=`none`}function N(e,t=`info`){w.classList.add(`visible`),w.classList.remove(`error`,`success`),t===`error`&&w.classList.add(`error`),t===`success`&&w.classList.add(`success`),T.textContent=e}function P(e){E.style.width=`${e}%`}function F(e){S.disabled=!e,C.disabled=!e}function I(e){return e<1?`${(e*1e3).toFixed(2)} µs`:e<1e3?`${e.toFixed(2)} ms`:`${(e/1e3).toFixed(2)} s`}function L(e){return e>=1e6?`${(e/1e6).toFixed(1)}M`:e>=1e3?`${(e/1e3).toFixed(0)}K`:e.toString()}function R(e,t){let n=document.createElement(`tr`),r=t&&e.algorithm!==`js-native`?t/e.totalTimeMs:e.speedupVsNative,i=r&&r>1?`fast`:`slow`,a=r?`${r.toFixed(2)}x`:`-`;n.innerHTML=`
    <td>${e.algorithm}</td>
    <td>${L(e.arraySize)}</td>
    <td>${I(e.totalTimeMs)}</td>
    <td>${e.gpuTimeMs===void 0?`-`:I(e.gpuTimeMs)}</td>
    <td class="speedup ${i}">${a}</td>
  `,O.appendChild(n),D.style.display=`block`}function z(){O.innerHTML=``,D.style.display=`none`}async function B(){if(!A||!k)return;let e=y.value,t=parseInt(b.value),n=parseInt(x.value);F(!1),z(),P(0);try{N(`Running JavaScript native sort (${L(t)} elements)...`),P(10);let r=await A.runSingle(`js-native`,t,n);if(R(r),P(30),e===`bitonic`||e===`both`){N(`Running Bitonic Sort (${L(t)} elements)...`),R(await A.runSingle(`bitonic`,t,n),r.totalTimeMs),P(e===`both`?60:90);let i=h.generateRandomData(Math.min(t,d)),a=new f(k),o=await a.sort(i),s=g.validate(i,o.sortedData);a.destroy(),s.isValid||console.warn(`Bitonic sort validation failed:`,s.errors)}if(e===`radix`||e===`both`){N(`Running Radix Sort (${L(t)} elements)...`),R(await A.runSingle(`radix`,t,n),r.totalTimeMs),P(90);let e=h.generateRandomData(Math.min(t,d)),i=new m(k),a=await i.sort(e),o=g.validate(e,a.sortedData);i.destroy(),o.isValid||console.warn(`Radix sort validation failed:`,o.errors)}P(100),N(`Benchmark complete!`,`success`)}catch(e){N(`Error: ${e instanceof Error?e.message:String(e)}`,`error`),console.error(e)}finally{F(!0)}}async function V(){if(!A)return;let e=[...u],t=parseInt(x.value);F(!1),z(),P(0);try{let n=e.length*3,r=0;for(let i of e){N(`Running JS sort (${L(i)} elements)...`);let e=await A.runSingle(`js-native`,i,t);R(e),r++,P(r/n*100),N(`Running Bitonic Sort (${L(i)} elements)...`),R(await A.runSingle(`bitonic`,i,t),e.totalTimeMs),r++,P(r/n*100),N(`Running Radix Sort (${L(i)} elements)...`),R(await A.runSingle(`radix`,i,t),e.totalTimeMs),r++,P(r/n*100)}N(`Full benchmark suite complete!`,`success`)}catch(e){N(`Error: ${e instanceof Error?e.message:String(e)}`,`error`),console.error(e)}finally{F(!0)}}function H(){S.addEventListener(`click`,B),C.addEventListener(`click`,V)}j();