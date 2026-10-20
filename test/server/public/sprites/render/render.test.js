import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ATLAS_PADDING, SQUARE_SIZE, buildAtlas, packAtlas } from '../../../../../server/public/sprites/render/atlas.js';
import { FLOATS_PER_INSTANCE, writeInstance } from '../../../../../server/public/sprites/render/instances.js';
import { makeRenderer, rendererBackends } from '../../../../../server/public/sprites/render/rendererFactory.js';
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
    assert.equal(rendererBackends.length, 2);
    mock.restoreAll();
  });
});
