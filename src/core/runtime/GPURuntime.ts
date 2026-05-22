export interface GPURuntime {
  isSupported(): boolean;
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}
