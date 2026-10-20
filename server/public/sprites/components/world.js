import Clouds from './clouds.js';
import Hanger from './hanger.js';
import MainCharacter from './mainCharacter.js';
import Runner from './runner.js';
import SpriteNode from './spriteNode.js';
import { sprites } from './catalog.js';
import { MAX_INSTANCES, writeInstance } from '../render/instances.js';

export const VIEW = Object.freeze({ halfWidth: 5 * 16 / 9, halfHeight: 5 });

export const characterMovement = Object.freeze({
  center: Object.freeze({ x: 0, y: -0.76 }),
  outOfBounds: Object.freeze({ x: 16, y: -0.76 }),
  jump: Object.freeze({ x: 0, y: 0 }),
  secondJump: Object.freeze({ x: 0, y: 1.2 }),
});

const GROUND_CELLS = Object.freeze([-9, -6, -3, 0, 3, 6, 9]);
const GROUND_ROW = -4;
const TILE_ANCHOR = 0.5;

const cloudsParams = Object.freeze([
  { y: 1.11, scaleX: 1.6020805, scaleY: 1.6844875, direction: 1, speed: 0.2 },
  { y: 2.83, scaleX: -1.2039709, scaleY: 1.1922802, direction: -1, speed: 0.3 },
]);

const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.bottom < b.top && b.bottom < a.top;

export default class World {
  #regions = null;
  #nodes = [];
  #clouds = [];
  mainCharacter = new MainCharacter();
  hanger = new Hanger();
  runner = new Runner();

  constructor(regions) {
    this.#regions = regions;
    const sky = SpriteNode.of('sky', { x: -0.0015, y: 0, scaleX: 7.187305, scaleY: 5.480379, order: 0 });
    const cloudNodes = cloudsParams.map(({ y, scaleX, scaleY, direction, speed }) => {
      const node = SpriteNode.of('clouds', { y, scaleX, scaleY, order: 1 });
      const halfWidth = regions.clouds.width / sprites.clouds.ppu * Math.abs(scaleX) / 2;
      this.#clouds.push(new Clouds(node, { direction, speed, halfWidth }));
      return node;
    });
    const ground = GROUND_CELLS.map(x => SpriteNode.of('ground', {
      x: x + TILE_ANCHOR,
      y: GROUND_ROW + TILE_ANCHOR,
      order: 1,
    }));
    this.#nodes = [
      sky,
      ...cloudNodes,
      ...ground,
      ...this.hanger.nodes,
      ...this.mainCharacter.nodes,
      ...this.runner.nodes,
    ].sort((a, b) => a.order - b.order);
  }

  update(dt) {
    for (const clouds of this.#clouds) clouds.update(dt, VIEW.halfWidth);
    this.hanger.update(dt);
    this.mainCharacter.update(dt);
    this.runner.update(dt);
    const caught = this.runner.running && overlaps(this.runner.bounds, this.mainCharacter.bounds);
    if (caught) this.mainCharacter.bodyVisible = false;
  }

  writeInstances(buffer) {
    let count = 0;
    for (const node of this.#nodes) {
      if (!node.visible || count === MAX_INSTANCES) continue;
      writeInstance(buffer, count++, node, this.#regions[node.sprite], sprites[node.sprite]);
    }
    return count;
  }

  resetState() {
    this.hanger.resetState();
    this.mainCharacter.resetState();
    this.runner.resetState();
  }
}
