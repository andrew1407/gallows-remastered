import WebGpuRenderer from './webgpu.js';
import WebGlRenderer from './webgl.js';

export const rendererBackends = Object.freeze([WebGpuRenderer, WebGlRenderer]);

export const makeRenderer = async (canvas, atlas, view, backends = rendererBackends) => {
  for (const backend of backends) {
    try {
      const renderer = await backend.of(canvas, atlas, view);
      if (renderer) return renderer;
    } catch (e) {
      console.warn(e);
    }
  }
  return null;
};
