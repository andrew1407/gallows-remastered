import HangerPart from './hangerPart.js';
import SpriteNode from './spriteNode.js';
import { SQUARE } from './catalog.js';

const ROOT = Object.freeze({ x: -1.37, y: 1.19 });
const ROPE_COLOR = Object.freeze([0, 0, 0, 1]);

const DROP_CURVE = Object.freeze([
  { time: 0, value: 0, slope: 2.060287 },
  { time: 0.30555052, value: 0.6295218, slope: 1.474795 },
  { time: 0.5733107, value: 0.8676417, slope: 0.6584979 },
  { time: 0.8122447, value: 0.96983206, slope: 0.28752825 },
  { time: 1, value: 1, slope: 0.1606769 },
]);

const dropping = Object.freeze({ start: { x: 0, y: 8 }, finish: { x: 0, y: 0 }, curve: DROP_CURVE });

const partsParams = Object.freeze([
  { sprite: 'hanger1', order: 3, ...dropping },
  { sprite: 'hanger2', order: 2, ...dropping },
  { sprite: 'hanger3', order: 2, ...dropping },
  { sprite: 'hanger4', order: 3, ...dropping },
  { sprite: 'stool', order: 2, start: { x: 15, y: -1.57 }, finish: { x: 1.32, y: -1.57 }, curve: DROP_CURVE },
]);

export default class Hanger {
  #root = SpriteNode.of(null, { ...ROOT, visible: false });
  #nodes = [];
  parts = [];

  constructor() {
    for (const { sprite, order, ...params } of partsParams) {
      const node = SpriteNode.of(sprite, { order, parent: this.#root });
      this.#nodes.push(node);
      this.parts.push(new HangerPart(node, params));
    }
    const holder = this.#nodes[3];
    const rope = SpriteNode.of(SQUARE, {
      x: 1.3247, y: 2.0244, scaleX: 0.11462694, scaleY: 1.7174903, order: 3, parent: holder, tint: ROPE_COLOR,
    });
    const ropeLoop = SpriteNode.of('ropeLoop', { x: 1.3247, y: 0.846, order: 2, parent: holder });
    this.#nodes.push(rope, ropeLoop);
  }

  get nodes() {
    return this.#nodes;
  }

  resetState() {
    for (const part of this.parts) part.resetState();
  }

  update(dt) {
    for (const part of this.parts) part.tick(dt);
  }
}
