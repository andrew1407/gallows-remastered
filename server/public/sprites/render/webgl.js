import { FLOATS_PER_INSTANCE, MAX_INSTANCES } from './instances.js';

const STRIDE = FLOATS_PER_INSTANCE * Float32Array.BYTES_PER_ELEMENT;
const CLEAR_COLOR = Object.freeze([0.19215687, 0.3019608, 0.4745098, 1]);

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 origin;
layout(location = 1) in vec2 extent;
layout(location = 2) in vec4 bounds;
layout(location = 3) in vec4 tint;
layout(location = 4) in vec4 flags;
uniform vec4 view;
out vec2 vUv;
flat out vec4 vUvRect;
flat out vec4 vTint;
flat out float vFiltered;
const vec2 corners[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
);
void main() {
  vec2 corner = corners[gl_VertexID];
  vec2 t = corner * 0.5 + 0.5;
  gl_Position = vec4((origin + corner * extent) * view.xy, 0.0, 1.0);
  vUv = vec2(mix(bounds.x, bounds.z, t.x), mix(bounds.w, bounds.y, t.y));
  vUvRect = vec4(min(bounds.xy, bounds.zw) + view.zw, max(bounds.xy, bounds.zw) - view.zw);
  vTint = tint;
  vFiltered = flags.x;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D pixelAtlas;
uniform sampler2D smoothAtlas;
in vec2 vUv;
flat in vec4 vUvRect;
flat in vec4 vTint;
flat in float vFiltered;
out vec4 color;
void main() {
  vec2 uv = clamp(vUv, vUvRect.xy, vUvRect.zw);
  color = mix(texture(pixelAtlas, uv), texture(smoothAtlas, uv), vFiltered) * vTint;
}`;

const attributes = Object.freeze([
  { location: 0, size: 2, offset: 0 },
  { location: 1, size: 2, offset: 8 },
  { location: 2, size: 4, offset: 16 },
  { location: 3, size: 4, offset: 32 },
  { location: 4, size: 4, offset: 48 },
]);

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
};

const linkProgram = gl => {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
};

const makeSampler = (gl, filter) => {
  const sampler = gl.createSampler();
  gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, filter);
  gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, filter);
  gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return sampler;
};

export default class WebGlRenderer {
  label = 'webgl';
  #gl = null;
  #buffer = null;

  static of(canvas, atlas, view) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      premultipliedAlpha: true,
    });
    return gl ? new WebGlRenderer(gl, atlas, view) : null;
  }

  constructor(gl, atlas, view) {
    this.#gl = gl;
    this.#setup(atlas, view);
    // Preventing the default lets the browser restore a context lost to a GPU reset; its state is rebuilt then.
    gl.canvas.addEventListener('webglcontextlost', e => e.preventDefault());
    gl.canvas.addEventListener('webglcontextrestored', () => this.#setup(atlas, view));
  }

  #setup(atlas, view) {
    const gl = this.#gl;
    const program = linkProgram(gl);
    gl.useProgram(program);
    gl.uniform4f(gl.getUniformLocation(program, 'view'),
      1 / view.halfWidth, 1 / view.halfHeight, 0.5 / atlas.width, 0.5 / atlas.height);

    gl.bindVertexArray(gl.createVertexArray());
    this.#buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.#buffer);
    gl.bufferData(gl.ARRAY_BUFFER, STRIDE * MAX_INSTANCES, gl.DYNAMIC_DRAW);
    for (const { location, size, offset } of attributes) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, STRIDE, offset);
      gl.vertexAttribDivisor(location, 1);
    }

    const texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    const samplers = { pixelAtlas: gl.NEAREST, smoothAtlas: gl.LINEAR };
    Object.entries(samplers).forEach(([uniform, filter], unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindSampler(unit, makeSampler(gl, filter));
      gl.uniform1i(gl.getUniformLocation(program, uniform), unit);
    });
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(...CLEAR_COLOR);
  }

  resize(width, height) {
    const { canvas } = this.#gl;
    canvas.width = width;
    canvas.height = height;
    this.#gl.viewport(0, 0, width, height);
  }

  draw(instances, count) {
    const gl = this.#gl;
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, instances, 0, count * FLOATS_PER_INSTANCE);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
  }
}
