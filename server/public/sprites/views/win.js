import { difficultyLevel, triesCount } from '../../../../difficulty.js';
import { animationStates } from '../components/mainCharacter.js';

const shouldSetBodyVisible = ({ difficulty, tries }) => (
  difficultyLevel[difficulty] === difficultyLevel.EASY && tries > triesCount.NORMAL
);

export default class WinViewController {
  #viewTools = null;

  constructor(viewTools) {
    this.#viewTools = viewTools;
  }

  *playActions(progress) {
    const { world: { mainCharacter }, tabs, movement } = this.#viewTools;
    tabs.word = progress.guessed;
    if (difficultyLevel[progress.difficulty] === difficultyLevel.NO_CHALLANGE)
      yield* mainCharacter.move(movement.center);
    if (shouldSetBodyVisible(progress)) {
      mainCharacter.bodyVisible = true;
      yield;
    }
    mainCharacter.currentState = animationStates.WIN_REACTION;
    yield;
  }
}
