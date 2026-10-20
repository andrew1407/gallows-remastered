export const waitForSeconds = seconds => {
  let left = seconds;
  return dt => (left -= dt) <= 0;
};

export const waitUntil = predicate => () => predicate();

export const waitWhile = predicate => () => !predicate();

export default class StageActivity {
  #coroutines = new Set();

  awaitActionFinish(action) {
    return new Promise(resolve => {
      const coroutine = { action, instruction: null, resolve };
      this.#coroutines.add(coroutine);
      this.#advance(coroutine);
    });
  }

  tick(dt) {
    for (const coroutine of this.#coroutines) {
      if (coroutine.instruction && !coroutine.instruction(dt)) continue;
      this.#advance(coroutine);
    }
  }

  resetState() {
    for (const { resolve } of this.#coroutines) resolve(false);
    this.#coroutines.clear();
  }

  #advance(coroutine) {
    const { value, done } = coroutine.action.next();
    coroutine.instruction = value ?? null;
    if (!done) return;
    this.#coroutines.delete(coroutine);
    coroutine.resolve(true);
  }
}
