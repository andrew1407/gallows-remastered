import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ATLAS_PADDING, SQUARE_SIZE, buildAtlas, packAtlas } from '../../../../../server/public/sprites/render/atlas.js';
import { FLOATS_PER_INSTANCE, writeInstance } from '../../../../../server/public/sprites/render/instances.js';
import { makeRenderer, rendererBackends } from '../../../../../server/public/sprites/render/rendererFactory.js';
import Canvas2dRenderer from '../../../../../server/public/sprites/render/canvas2d.js';
import SpriteNode from '../../../../../server/public/sprites/components/spriteNode.js';

const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const makeCanvasStub = (width, height) => {
  const calls = [];
  return {
    width,
    height,
    calls,
    getContext: () => ({
      set fillStyle(value) {
        calls.push(['fillStyle', value]);
      },
      drawImage: (...args) => calls.push(['drawImage', ...args]),
      fillRect: (...args) => calls.push(['fillRect', ...args]),
    }),
  };
};

describe('sprite rendering', () => {
  it('packs sprites onto padded shelves without overlaps', () => {
    const sizes = [{ width: 1184, height: 1184 }, { width: 512, height: 512 }, { width: 500, height: 362 }, { width: 32, height: 32 }];
    const { width, height, rects } = packAtlas(sizes);
    assert.ok(width <= 2048);
    for (const [i, a] of rects.entries())
      for (const b of rects.slice(i + 1)) assert.equal(overlaps(a, b), false);
    assert.ok(rects.every(r => r.x >= ATLAS_PADDING && r.x + r.width <= width && r.y + r.height <= height));
    assert.equal(packAtlas([{ width: 10, height: 10 }, { width: 10, height: 10 }], 20).rects[1].y, 14);
  });

  it('composes images and a white square into normalized regions', () => {
    const image = { width: 8, height: 4 };
    const atlas = buildAtlas({ body: image, square: null }, makeCanvasStub);
    const { body, square } = atlas.regions;
    assert.deepEqual([square.width, square.height], [SQUARE_SIZE, SQUARE_SIZE]);
    assert.deepEqual([body.width, body.height], [8, 4]);
    assert.ok(body.u1 > body.u0 && body.v1 > body.v0 && body.u1 <= 1);
    const names = atlas.canvas.calls.map(([name]) => name);
    assert.deepEqual(names, ['fillStyle', 'drawImage', 'fillRect']);
  });

  it('writes instances with flipping, tint and filter', () => {
    const buffer = new Float32Array(FLOATS_PER_INSTANCE * 2);
    const node = SpriteNode.of('clouds', { x: 1, y: 2, scaleX: -2, scaleY: 1, tint: [0, 0, 0, 1] });
    const region = { width: 100, height: 50, u0: 0.1, v0: 0.2, u1: 0.3, v1: 0.4 };
    writeInstance(buffer, 1, node, region, { ppu: 100, filter: 1 });
    assert.deepEqual([...buffer.subarray(16, 29)].map(v => Math.round(v * 100) / 100),
      [1, 2, 1, 0.25, 0.3, 0.2, 0.1, 0.4, 0, 0, 0, 1, 1]);
  });

  it('falls back through renderer backends', async () => {
    const warn = mock.method(console, 'warn', () => {});
    const renderer = { label: 'stub' };
    const backends = [
      { of: async () => null },
      { of: () => { throw new Error('no context'); } },
      { of: () => renderer },
    ];
    assert.equal(await makeRenderer({}, {}, {}, backends), renderer);
    assert.equal(warn.mock.callCount(), 1);
    const canvas = { getContext: () => null };
    assert.equal(await makeRenderer(canvas, {}, {}), null);
    assert.equal(rendererBackends.length, 3);
    mock.restoreAll();
  });

  it('draws instances on a 2d canvas with flipping, tint and filter', () => {
    const recorder = (canvas = null) => {
      const calls = [];
      const context = new Proxy({ calls, canvas }, {
        get: (target, key) => key in target ? target[key] : (...args) => calls.push([key, ...args]),
        set: (target, key, value) => void calls.push([key, value]) ?? true,
      });
      return { context, calls };
    };
    const tinted = [];
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => drawn.context,
      ownerDocument: {
        createElement: () => {
          const { context } = recorder();
          const copy = { getContext: () => context, context };
          tinted.push(copy);
          return copy;
        },
      },
    };
    const drawn = recorder(canvas);
    const atlas = { canvas: 'atlas', width: 100, height: 50 };
    const renderer = Canvas2dRenderer.of(canvas, atlas, { halfWidth: 2, halfHeight: 1 });
    assert.equal(renderer.label, 'canvas2d');
    renderer.resize(200, 100);
    assert.deepEqual([canvas.width, canvas.height], [200, 100]);

    const buffer = new Float32Array(FLOATS_PER_INSTANCE * 3);
    const region = { width: 20, height: 10, u0: 0.1, v0: 0.2, u1: 0.3, v1: 0.4 };
    const nodes = [
      SpriteNode.of('clouds', { x: 1, y: 0.5, scaleX: -1 }),
      SpriteNode.of('square', { tint: [0, 0, 0, 0.5] }),
      SpriteNode.of('square', { tint: [0, 0, 0, 0.5] }),
    ];
    nodes.forEach((node, i) => writeInstance(buffer, i, node, region, { ppu: 10, filter: i ? 0 : 1 }));
    renderer.draw(buffer, 3);

    const of = name => drawn.calls.filter(([key]) => key === name).map(([, ...args]) => args);
    assert.deepEqual(of('fillRect'), [[0, 0, 200, 100]]);
    assert.deepEqual(of('setTransform').slice(1), [[-1, 0, 0, 1, 150, 25], [1, 0, 0, 1, 100, 50], [1, 0, 0, 1, 100, 50]]);
    assert.deepEqual(of('globalAlpha'), [[1], [1], [0.5], [0.5]]);
    assert.deepEqual(of('imageSmoothingEnabled'), [[true], [false], [false]]);
    const [plain, ...rest] = of('drawImage');
    assert.deepEqual(plain, ['atlas', 10, 10, 20, 10, -50, -25, 100, 50]);
    assert.equal(tinted.length, 1);
    assert.ok(rest.every(([source, ...args]) => source === tinted[0] && args.join() === '0,0,20,10,-50,-25,100,50'));
    assert.ok(tinted[0].context.calls.some(([key, value]) => key === 'fillStyle' && value === 'rgb(0, 0, 0)'));
    assert.equal(Canvas2dRenderer.of({ getContext: () => null }, atlas, {}), null);
  });
});
