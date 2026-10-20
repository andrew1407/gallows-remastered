import { animationStates } from '../components/mainCharacter.js';
import { waitForSeconds } from '../gameLoop/stageActivity.js';

const DIALOGUE_DURATION = 5;

export default class PrologueViewController {
  #viewTools = null;

  constructor(viewTools) {
    this.#viewTools = viewTools;
  }

  *playActions() {
    const { world: { mainCharacter }, tabs, movement } = this.#viewTools;
    tabs.message = '';
    yield* mainCharacter.move(movement.center);
    mainCharacter.currentState = animationStates.TALKING;
    yield;
    tabs.characterDialogueVisible = true;
    yield waitForSeconds(DIALOGUE_DURATION);
    tabs.characterDialogueVisible = false;
    yield;
    yield* mainCharacter.move(movement.outOfBounds);
    mainCharacter.resetState();
  }
}
