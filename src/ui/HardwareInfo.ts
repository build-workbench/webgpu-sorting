import { GPUContext } from '../core/GPUContext';

export interface HardwareProfile {
  deviceDescription: string;
  vendor: string;
  architecture: string;
  isFallback: boolean;
  maxWorkgroupInvocations: number;
  maxStorageBufferSize: string;
  maxBufferSize: string;
  timestampQuerySupported: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Detects hardware details from WebGPU adapter and device
 */
export async function getHardwareProfile(gpuContext: GPUContext): Promise<HardwareProfile> {
  const adapter = gpuContext.getAdapter();
  const device = gpuContext.getDevice();

  let vendor = '通用 GPU';
  let architecture = 'WGSL Compute';
  let deviceDescription = '硬件加速 WebGPU 设备';
  let isFallback = false;

  if (adapter) {
    // Check fallback
    if ('isFallbackAdapter' in adapter && adapter.isFallbackAdapter) {
      isFallback = true;
      deviceDescription = 'CPU 软件回退仿真器 (Fallback Adapter)';
    }

    // Modern WebGPU: adapter.info is synchronous GPUAdapterInfo
    if ('info' in adapter && (adapter as unknown as { info?: GPUAdapterInfo }).info) {
      const info = (adapter as unknown as { info: GPUAdapterInfo }).info;
      if (info.description) deviceDescription = info.description;
      else if (info.device) deviceDescription = info.device;

      if (info.vendor) vendor = info.vendor;
      if (info.architecture) architecture = info.architecture;
    } else if ('requestAdapterInfo' in adapter) {
      try {
        // Legacy async requestAdapterInfo
        const info = await (
          adapter as unknown as { requestAdapterInfo: () => Promise<GPUAdapterInfo> }
        ).requestAdapterInfo();
        if (info.description) deviceDescription = info.description;
        else if (info.device) deviceDescription = info.device;
        if (info.vendor) vendor = info.vendor;
        if (info.architecture) architecture = info.architecture;
      } catch {
        // Ignore fallback errors
      }
    }
  }

  const limits = device?.limits ?? adapter?.limits;
  const maxWorkgroupInvocations = limits?.maxComputeInvocationsPerWorkgroup ?? 256;
  const maxStorageBufferSize = formatBytes(limits?.maxStorageBufferBindingSize ?? 134217728);
  const maxBufferSize = formatBytes(limits?.maxBufferSize ?? 268435456);

  const timestampQuerySupported = Boolean(
    device?.features?.has('timestamp-query') || adapter?.features?.has('timestamp-query')
  );

  return {
    deviceDescription,
    vendor,
    architecture,
    isFallback,
    maxWorkgroupInvocations,
    maxStorageBufferSize,
    maxBufferSize,
    timestampQuerySupported,
  };
}
