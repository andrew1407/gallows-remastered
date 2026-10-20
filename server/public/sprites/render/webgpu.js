import { FLOATS_PER_INSTANCE, MAX_INSTANCES } from './instances.js';

const STRIDE = FLOATS_PER_INSTANCE * Float32Array.BYTES_PER_ELEMENT;
const CLEAR_COLOR = Object.freeze({ r: 0.19215687, g: 0.3019608, b: 0.4745098, a: 1 });
const BLEND = Object.freeze({ srcFactor: 'one', dstFactor: 'one-minus-src-alpha' });

const SHADER = `
struct View {
  scale: vec2f,
  halfTexel: vec2f,
};

struct Instance {
  @location(0) origin: vec2f,
  @location(1) extent: vec2f,
  @location(2) bounds: vec4f,
  @location(3) tint: vec4f,
  @location(4) flags: vec4f,
};

struct Fragment {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) uvRect: vec4f,
  @location(2) @interpolate(flat) tint: vec4f,
  @location(3) @interpolate(flat) filtered: f32,
};

@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var atlas: texture_2d<f32>;
@group(0) @binding(2) var nearestSampler: sampler;
@group(0) @binding(3) var linearSampler: sampler;

@vertex
fn vertexMain(@builtin(vertex_index) index: u32, instance: Instance) -> Fragment {
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
  );
  let corner = corners[index];
  let t = corner * 0.5 + 0.5;
  let bounds = instance.bounds;
  var fragment: Fragment;
  fragment.position = vec4f((instance.origin + corner * instance.extent) * view.scale, 0.0, 1.0);
  fragment.uv = vec2f(mix(bounds.x, bounds.z, t.x), mix(bounds.w, bounds.y, t.y));
  fragment.uvRect = vec4f(min(bounds.xy, bounds.zw) + view.halfTexel, max(bounds.xy, bounds.zw) - view.halfTexel);
  fragment.tint = instance.tint;
  fragment.filtered = instance.flags.x;
  return fragment;
}

@fragment
fn fragmentMain(fragment: Fragment) -> @location(0) vec4f {
  let uv = clamp(fragment.uv, fragment.uvRect.xy, fragment.uvRect.zw);
  let nearestColor = textureSample(atlas, nearestSampler, uv);
  let linearColor = textureSample(atlas, linearSampler, uv);
  return mix(nearestColor, linearColor, fragment.filtered) * fragment.tint;
}
`;

const attributes = Object.freeze([
  { shaderLocation: 0, offset: 0, format: 'float32x2' },
  { shaderLocation: 1, offset: 8, format: 'float32x2' },
  { shaderLocation: 2, offset: 16, format: 'float32x4' },
  { shaderLocation: 3, offset: 32, format: 'float32x4' },
  { shaderLocation: 4, offset: 48, format: 'float32x4' },
]);

export default class WebGpuRenderer {
  label = 'webgpu';
  #canvas = null;
  #atlas = null;
  #view = null;
  #device = null;
  #context = null;
  #pipeline = null;
  #bindGroup = null;
  #instanceBuffer = null;

  static async of(canvas, atlas, view) {
    const renderer = new WebGpuRenderer(canvas, atlas, view);
    return await renderer.#start() ? renderer : null;
  }

  constructor(canvas, atlas, view) {
    this.#canvas = canvas;
    this.#atlas = atlas;
    this.#view = view;
  }

  async #start() {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return false;
    const device = await adapter.requestDevice();
    device.pushErrorScope('validation');
    this.#build(device);
    const error = await device.popErrorScope();
    if (error || !this.#attach(device)) {
      device.destroy();
      if (error) throw new Error(error.message);
      return false;
    }
    // A device lost to a GPU reset or driver update is replaced, the canvas context is reconfigured.
    device.lost.then(({ reason }) => {
      if (reason !== 'destroyed') this.#start().catch(console.warn);
    });
    return true;
  }

  #build(device) {
    const atlas = this.#atlas;
    const view = this.#view;
    this.#device = device;
    const format = navigator.gpu.getPreferredCanvasFormat();

    const size = [atlas.width, atlas.height];
    const texture = device.createTexture({
      size,
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture({ source: atlas.canvas }, { texture, premultipliedAlpha: true }, size);

    const uniforms = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const halfTexel = [0.5 / atlas.width, 0.5 / atlas.height];
    device.queue.writeBuffer(uniforms, 0, new Float32Array([1 / view.halfWidth, 1 / view.halfHeight, ...halfTexel]));

    this.#instanceBuffer = device.createBuffer({
      size: STRIDE * MAX_INSTANCES,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const module = device.createShaderModule({ code: SHADER });
    this.#pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vertexMain',
        buffers: [{ arrayStride: STRIDE, stepMode: 'instance', attributes }],
      },
      fragment: {
        module,
        entryPoint: 'fragmentMain',
        targets: [{ format, blend: { color: BLEND, alpha: BLEND } }],
      },
      primitive: { topology: 'triangle-list' },
    });

    const sampler = filter => device.createSampler({ magFilter: filter, minFilter: filter });
    this.#bindGroup = device.createBindGroup({
      layout: this.#pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniforms } },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: sampler('nearest') },
        { binding: 3, resource: sampler('linear') },
      ],
    });
  }

  #attach(device) {
    this.#context = this.#canvas.getContext('webgpu');
    this.#context?.configure({
      device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'opaque',
    });
    return !!this.#context;
  }

  resize(width, height) {
    this.#canvas.width = width;
    this.#canvas.height = height;
  }

  draw(instances, count) {
    this.#device.queue.writeBuffer(this.#instanceBuffer, 0, instances, 0, count * FLOATS_PER_INSTANCE);
    const encoder = this.#device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.#context.getCurrentTexture().createView(),
        clearValue: CLEAR_COLOR,
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.#pipeline);
    pass.setBindGroup(0, this.#bindGroup);
    pass.setVertexBuffer(0, this.#instanceBuffer);
    pass.draw(6, count);
    pass.end();
    this.#device.queue.submit([encoder.finish()]);
  }
}
