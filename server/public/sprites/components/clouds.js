const OUT_OF_BORDER = 14;

export default class Clouds {
  #node = null;
  #direction = 0;
  #speed = 0;
  #startPosition = 0;
  #halfWidth = 0;

  constructor(node, { direction, speed, halfWidth }) {
    this.#node = node;
    this.#direction = direction;
    this.#speed = speed;
    this.#halfWidth = halfWidth;
    this.#startPosition = OUT_OF_BORDER * -direction;
    node.x = this.#startPosition;
  }

  update(dt, halfViewWidth) {
    const wasVisible = this.#isVisible(halfViewWidth);
    this.#node.x += dt * this.#speed * this.#direction;
    if (wasVisible && !this.#isVisible(halfViewWidth)) this.#node.x = this.#startPosition;
  }

  #isVisible(halfViewWidth) {
    return Math.abs(this.#node.x) < halfViewWidth + this.#halfWidth;
  }
}
