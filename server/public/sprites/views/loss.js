import { animationStates } from '../components/mainCharacter.js';
import { waitForSeconds, waitWhile } from '../gameLoop/stageActivity.js';

const RUNNER_DIALOGUE_DURATION = 2;

export default class LossViewController {
  #viewTools = null;
  #messageText = '';

  #lossHandlers = Object.freeze({
    NO_CHALLANGE: () => this.#showMessage(),
    EASY: () => this.#hangCharacter(),
    NORMAL: () => this.#hangCharacter(),
    DIFFICULT: () => this.#activateRunner(),
  });

  constructor(viewTools, messageText) {
    this.#viewTools = viewTools;
    this.#messageText = messageText;
  }

  *playActions(progress) {
    this.#viewTools.tabs.tries = progress.tries;
    yield* this.#lossHandlers[progress.difficulty]();
  }

  *#hangCharacter() {
    const { world: { mainCharacter }, movement } = this.#viewTools;
    yield* mainCharacter.jump(movement.secondJump);
    mainCharacter.currentState = animationStates.HANGED;
  }

  *#showMessage() {
    this.#viewTools.tabs.message = this.#messageText;
    yield;
  }

  *#activateRunner() {
    const { tabs, world: { runner } } = this.#viewTools;
    tabs.runnerDialogueVisible = true;
    yield waitForSeconds(RUNNER_DIALOGUE_DURATION);
    tabs.runnerDialogueVisible = false;
    yield;
    runner.startRun();
    yield waitWhile(() => runner.running);
  }
}
