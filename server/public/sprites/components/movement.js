export const movementStates = Object.freeze({
  IDLE: 'idle',
  JUMP: 'jump',
  WALK: 'walk',
});

export default class MovementController {
  #node = null;
  #walkSpeed = 0;
  #jumpSpeed = 0;
  #destination = null;
  state = movementStates.IDLE;

  constructor(node, { walkSpeed, jumpSpeed }) {
    this.#node = node;
    this.#walkSpeed = walkSpeed;
    this.#jumpSpeed = jumpSpeed;
  }

  action(dt) {
    if (this.state === movementStates.IDLE) return;
    const speed = this.state === movementStates.JUMP ? this.#jumpSpeed : this.#walkSpeed;
    const dx = this.#destination.x - this.#node.x;
    const dy = this.#destination.y - this.#node.y;
    const distance = Math.hypot(dx, dy);
    const step = speed * dt;
    if (distance > step) {
      this.#node.x += dx / distance * step;
      this.#node.y += dy / distance * step;
      return;
    }
    this.#node.x = this.#destination.x;
    this.#node.y = this.#destination.y;
    this.stop();
  }

  go(point) {
    this.#setState(movementStates.WALK, point);
  }

  jump(point) {
    this.#setState(movementStates.JUMP, point);
  }

  stop() {
    this.#setState(movementStates.IDLE, null);
  }

  #setState(state, point) {
    this.state = state;
    this.#destination = point;
  }
}
