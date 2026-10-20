export default class DifficultyViewController {
  #viewTools = null;
  #text = '';
  #oncePerformed = false;

  constructor(viewTools, text) {
    this.#viewTools = viewTools;
    this.#text = text;
  }

  *playActions() {
    if (this.#oncePerformed) return;
    this.#viewTools.tabs.message = this.#text;
    this.#oncePerformed = true;
  }

  resetState() {
    this.#oncePerformed = false;
  }
}
