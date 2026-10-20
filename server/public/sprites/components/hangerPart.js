import { evaluateCurve } from './curve.js';

const lerp = (a, b, t) => a + (b - a) * t;

export default class HangerPart {
  #node = null;
  #params = null;
  #progress = 0;
  moving = false;

  constructor(node, params) {
    this.#node = node;
    this.#params = params;
    Object.assign(node, params.start);
  }

  startMove() {
    this.moving = true;
  }

  resetState() {
    this.moving = false;
    this.#progress = 0;
    Object.assign(this.#node, this.#params.start);
  }

  tick(dt) {
    if (!this.moving) return;
    const { start, finish, curve } = this.#params;
    this.#progress += dt;
    const t = evaluateCurve(curve, this.#progress);
    const x = lerp(start.x, finish.x, t);
    const y = lerp(start.y, finish.y, t);
    if (x === this.#node.x && y === this.#node.y) this.moving = false;
    this.#node.x = x;
    this.#node.y = y;
  }
}
