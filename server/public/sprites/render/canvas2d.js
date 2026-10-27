import { FLOATS_PER_INSTANCE } from './instances.js';

const CLEAR_COLOR = 'rgb(49, 77, 121)';

const toCss = ([r, g, b]) => `rgb(${r * 255}, ${g * 255}, ${b * 255})`;

const isWhite = tint => tint[0] === 1 && tint[1] === 1 && tint[2] === 1;

// The GPU backends multiply texels by the tint in the shader, here a tinted copy of the region is cached instead.
const makeTinted = (createCanvas, source, [sx, sy, sw, sh], tint) => {
  const canvas = createCanvas(sw, sh);
  const context = canvas.getContext('2d');
  context.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = toCss(tint);
  context.fillRect(0, 0, sw, sh);
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
};

export default class Canvas2dRenderer {
  label = 'canvas2d';
  #context = null;
  #atlas = null;
  #view = null;
  #createCanvas = null;
  #tinted = new Map();

  static of(canvas, atlas, view) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return null;
    const createCanvas = (width, height) => Object.assign(canvas.ownerDocument.createElement('canvas'), { width, height });
    return new Canvas2dRenderer(context, atlas, view, createCanvas);
  }

  constructor(context, atlas, view, createCanvas) {
    this.#context = context;
    this.#atlas = atlas;
    this.#view = view;
    this.#createCanvas = createCanvas;
  }

  resize(width, height) {
    const { canvas } = this.#context;
    canvas.width = width;
    canvas.height = height;
  }

  draw(instances, count) {
    const context = this.#context;
    const { width, height } = context.canvas;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = CLEAR_COLOR;
    context.fillRect(0, 0, width, height);
    const scaleX = width / 2 / this.#view.halfWidth;
    const scaleY = height / 2 / this.#view.halfHeight;
    for (let i = 0; i < count; ++i) {
      const o = i * FLOATS_PER_INSTANCE;
      const [x, y, extentX, extentY, u0, v0, u1, v1] = instances.subarray(o, o + 8);
      const tint = instances.subarray(o + 8, o + 12);
      const halfWidth = extentX * scaleX;
      const halfHeight = extentY * scaleY;
      context.setTransform(u0 > u1 ? -1 : 1, 0, 0, 1, width / 2 + x * scaleX, height / 2 - y * scaleY);
      context.globalAlpha = tint[3];
      context.imageSmoothingEnabled = instances[o + 12] > 0;
      const [source, sx, sy, sw, sh] = this.#source(u0, v0, u1, v1, tint);
      context.drawImage(source, sx, sy, sw, sh, -halfWidth, -halfHeight, halfWidth * 2, halfHeight * 2);
    }
  }

  #source(u0, v0, u1, v1, tint) {
    const { canvas, width, height } = this.#atlas;
    const rect = [
      Math.round(Math.min(u0, u1) * width),
      Math.round(v0 * height),
      Math.round(Math.abs(u1 - u0) * width),
      Math.round((v1 - v0) * height),
    ];
    if (isWhite(tint)) return [canvas, ...rect];
    const key = `${rect}:${[...tint.subarray(0, 3)]}`;
    if (!this.#tinted.has(key)) this.#tinted.set(key, makeTinted(this.#createCanvas, canvas, rect, tint));
    const [, , sw, sh] = rect;
    return [this.#tinted.get(key), 0, 0, sw, sh];
  }
}
