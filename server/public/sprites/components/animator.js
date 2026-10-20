export const makeClip = (frames, length = 0, loop = length > 0) => Object.freeze({ frames, length, loop });

export default class Animator {
  #clips = null;
  #state = null;
  #time = 0;

  constructor(clips, initial) {
    this.#clips = clips;
    this.play(initial);
  }

  get state() {
    return this.#state;
  }

  get sprite() {
    const { frames, length, loop } = this.#clips[this.#state];
    const time = loop ? this.#time % length : this.#time;
    let current = frames[0][0];
    for (const [sprite, start] of frames)
      if (start <= time) current = sprite;
    return current;
  }

  play(state) {
    if (this.#state === state) return;
    this.#state = state;
    this.#time = 0;
  }

  update(dt) {
    this.#time += dt;
  }
}
