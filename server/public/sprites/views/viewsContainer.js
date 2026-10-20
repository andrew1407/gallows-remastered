import { labels } from '../../../../scenes/tools.js';
import DifficultyViewController from './difficulty.js';
import GameplayViewController from './gameplay.js';
import LossViewController from './loss.js';
import PrologueViewController from './prologue.js';
import WinViewController from './win.js';

export default class ViewsContainer {
  #controllers = null;

  constructor(viewTools, { difficultyText, lossMessage }) {
    this.#controllers = Object.freeze({
      [labels.difficulty]: new DifficultyViewController(viewTools, difficultyText),
      [labels.prologue]: new PrologueViewController(viewTools),
      [labels.gameplay]: new GameplayViewController(viewTools),
      [labels.loss]: new LossViewController(viewTools, lossMessage),
      [labels.win]: new WinViewController(viewTools),
    });
  }

  get(stage) {
    return this.#controllers[stage];
  }

  resetState() {
    for (const stage in this.#controllers) this.#controllers[stage].resetState?.();
  }
}
