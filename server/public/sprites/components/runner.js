import Animator, { makeClip } from './animator.js';
import SpriteNode, { getBounds } from './spriteNode.js';

const states = Object.freeze({
  IDLE: 'idle',
  RUN: 'run',
});

const clips = Object.freeze({
  [states.IDLE]: makeClip([['runner1', 0]]),
  [states.RUN]: makeClip([['runner1', 0], ['runner2', 0.1], ['runner1', 0.2]], 0.21666667),
});

const ORDER = 4;
const SPEED = 14;
const OUT_OF_BORDER = 14;
const INITIAL_POSITION = Object.freeze({ x: -11.04, y: -0.76 });
const START_POSITION = Object.freeze({ x: -12, y: -0.76 });
const COLLIDER = Object.freeze({ x: 0.48, y: 0, width: 1.24, height: 2.49 });

export default class Runner {
  #node = SpriteNode.of('runner1', { ...INITIAL_POSITION, order: ORDER });
  #animator = new Animator(clips, states.IDLE);
  running = false;

  get nodes() {
    return [this.#node];
  }

  get bounds() {
    return getBounds(this.#node, COLLIDER);
  }

  resetState() {
    Object.assign(this.#node, START_POSITION);
    this.#animator.play(states.IDLE);
    this.running = false;
  }

  startRun() {
    this.running = true;
    this.#animator.play(states.RUN);
  }

  update(dt) {
    this.#animator.update(dt);
    this.#node.sprite = this.#animator.sprite;
    if (!this.running) return;
    this.#node.x += dt * SPEED;
    if (this.#node.x < OUT_OF_BORDER) return;
    this.running = false;
    this.#animator.play(states.IDLE);
  }
}
