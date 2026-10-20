import Animator, { makeClip } from './animator.js';
import MovementController, { movementStates } from './movement.js';
import SpriteNode, { getBounds } from './spriteNode.js';
import { waitUntil } from '../gameLoop/stageActivity.js';

export const animationStates = Object.freeze({
  IDLE: 'idle',
  STANDING: 'standing',
  HANGED: 'hanged',
  WALKING: 'walking',
  TALKING: 'talking',
  WIN_REACTION: 'win',
});

export const bodyParts = Object.freeze({
  HEAD: 'head',
  TORSO: 'torso',
  LEFT_HAND: 'leftHand',
  LEFT_LEG: 'leftLeg',
  RIGHT_HAND: 'rightHand',
  RIGHT_LEG: 'rightLeg',
});

const clips = Object.freeze({
  [animationStates.IDLE]: makeClip([['body1', 0]]),
  [animationStates.STANDING]: makeClip([['body1', 0], ['body2', 0.85], ['body1', 2]], 2.0166667),
  [animationStates.HANGED]: makeClip([['bodyHanged', 0]]),
  [animationStates.WALKING]: makeClip([['bodyWalking1', 0], ['bodyWalking2', 0.5], ['bodyWalking1', 1]], 1.0166667),
  [animationStates.TALKING]: makeClip([['body1', 0], ['bodyTalking', 0.6666667], ['body1', 1.3333334]], 1.35),
  [animationStates.WIN_REACTION]: makeClip([['win1', 0], ['win2', 0.75], ['win1', 1.5]], 1.5166667),
});

const ORDER = 3;
const START_POSITION = Object.freeze({ x: -12, y: -0.76 });
const SPEED = Object.freeze({ walkSpeed: 3, jumpSpeed: 3 });
const COLLIDER = Object.freeze({ x: -0.06, y: -0.05, width: 0.68, height: 2.28 });

export default class MainCharacter {
  #body = SpriteNode.of('body1', { ...START_POSITION, order: ORDER });
  #parts = {};
  #animator = new Animator(clips, animationStates.IDLE);
  #movement = new MovementController(this.#body, SPEED);

  constructor() {
    for (const part of Object.values(bodyParts))
      this.#parts[part] = SpriteNode.of(part, { order: ORDER, parent: this.#body, visible: false });
  }

  get nodes() {
    return [this.#body, ...Object.values(this.#parts)];
  }

  get transform() {
    return this.#body;
  }

  get bounds() {
    return getBounds(this.#body, COLLIDER);
  }

  get bodyVisible() {
    return this.#body.visible;
  }

  set bodyVisible(value) {
    for (const part in this.#parts) this.#parts[part].visible = false;
    this.#body.visible = value;
  }

  get currentState() {
    return this.#animator.state;
  }

  set currentState(state) {
    this.#animator.play(state);
  }

  setBodyPartVisible(part) {
    this.#parts[part].visible = true;
  }

  resetState() {
    this.#movement.stop();
    Object.assign(this.#body, START_POSITION);
    this.bodyVisible = true;
    this.currentState = animationStates.IDLE;
  }

  *move(point) {
    this.currentState = animationStates.WALKING;
    this.#movement.go(point);
    yield waitUntil(() => this.#movement.state === movementStates.IDLE);
    this.currentState = animationStates.STANDING;
  }

  *jump(point) {
    this.currentState = animationStates.IDLE;
    this.#movement.jump(point);
    yield waitUntil(() => this.#movement.state === movementStates.IDLE);
    this.currentState = animationStates.STANDING;
  }

  update(dt) {
    this.#movement.action(dt);
    this.#animator.update(dt);
    this.#body.sprite = this.#animator.sprite;
  }
}
