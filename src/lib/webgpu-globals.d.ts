/** Minimal WebGPU types so the Voronoi JFA compiles without @webgpu/types. */
interface GPU {
  requestAdapter(): Promise<GPUAdapter | null>;
}
interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>;
}
interface GPUDevice {
  createShaderModule(desc: { code: string }): GPUShaderModule;
  createBindGroupLayout(desc: unknown): GPUBindGroupLayout;
  createPipelineLayout(desc: unknown): GPUPipelineLayout;
  createComputePipeline(desc: unknown): GPUComputePipeline;
  createBindGroup(desc: unknown): GPUBindGroup;
  createBuffer(desc: {
    size: number;
    usage: number;
  }): GPUBuffer;
  createCommandEncoder(): GPUCommandEncoder;
  queue: { writeBuffer(buf: GPUBuffer, off: number, data: BufferSource): void; submit(cmds: GPUCommandBuffer[]): void };
}
interface GPUShaderModule {}
interface GPUBindGroupLayout {}
interface GPUPipelineLayout {}
interface GPUComputePipeline {}
interface GPUBindGroup {}
interface GPUCommandBuffer {}
interface GPUBuffer {
  destroy(): void;
  mapAsync(mode: number): Promise<void>;
  getMappedRange(): ArrayBuffer;
  unmap(): void;
}
interface GPUCommandEncoder {
  beginComputePass(): GPUComputePass;
  copyBufferToBuffer(src: GPUBuffer, s: number, dst: GPUBuffer, d: number, size: number): void;
  finish(): GPUCommandBuffer;
}
interface GPUComputePass {
  setPipeline(p: GPUComputePipeline): void;
  setBindGroup(i: number, g: GPUBindGroup): void;
  dispatchWorkgroups(x: number, y: number): void;
  end(): void;
}
declare const GPUShaderStage: { COMPUTE: number };
declare const GPUBufferUsage: {
  STORAGE: number;
  COPY_DST: number;
  COPY_SRC: number;
  UNIFORM: number;
  MAP_READ: number;
};
declare const GPUMapMode: { READ: number };
interface Navigator {
  gpu?: GPU;
}
