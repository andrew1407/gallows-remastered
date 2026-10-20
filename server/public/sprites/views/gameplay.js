import { difficultyLevel, triesCount } from '../../../../difficulty.js';
import { formatTries } from '../../../../scenes/tools.js';
import { animationStates, bodyParts } from '../components/mainCharacter.js';
import { waitWhile } from '../gameLoop/stageActivity.js';

const BODY_PARTS_OFFSET = 2;

const bodyPartsAppearanceOrder = Object.freeze([
  bodyParts.LEFT_LEG,
  bodyParts.RIGHT_LEG,
  bodyParts.TORSO,
  bodyParts.LEFT_HAND,
  bodyParts.RIGHT_HAND,
]);

const difficultyIs = (difficulty, comparable) => difficultyLevel[difficulty] === comparable;

export default class GameplayViewController {
  #viewTools = null;
  #initial = true;
  #triesPreviously = 0;

  #lossHandlers = Object.freeze({
    NO_CHALLANGE: progress => this.#updateTriesView(progress),
    EASY: progress => this.#easyModeAction(progress),
    NORMAL: progress => this.#showHangerPart(progress),
    DIFFICULT: progress => this.#updateTriesView(progress),
  });

  constructor(viewTools) {
    this.#viewTools = viewTools;
  }

  *playActions(progress) {
    yield* this.#initial ? this.#executeInitialActions(progress) : this.#showGuessAttempt(progress);
    this.#triesPreviously = progress.tries;
  }

  resetState() {
    this.#initial = true;
    this.#triesPreviously = 0;
  }

  *#executeInitialActions(progress) {
    this.#initial = false;
    const { tabs, world, movement } = this.#viewTools;
    const { difficulty } = progress;
    tabs.message = '';
    if (!difficultyIs(difficulty, difficultyLevel.NO_CHALLANGE)) {
      if (difficultyIs(difficulty, difficultyLevel.EASY)) this.#placeCharacterBody();
      else yield* world.mainCharacter.move(movement.center);
    }
    tabs.word = progress.guessed;
    yield* this.#updateTriesView(progress);
    tabs.guessingVisible = true;
  }

  *#showGuessAttempt(progress) {
    const guessed = this.#triesPreviously === progress.tries;
    if (guessed) this.#viewTools.tabs.word = progress.guessed;
    else yield* this.#lossHandlers[progress.difficulty](progress);
  }

  *#showHangerPart(progress) {
    yield* this.#updateTriesView(progress);
    const { world, movement } = this.#viewTools;
    const lastTry = progress.tries === 1;
    if (lastTry) {
      yield;
      yield* world.mainCharacter.jump(movement.jump);
      return;
    }
    const { parts } = world.hanger;
    const hangerPart = parts[parts.length - progress.tries + 1];
    hangerPart.startMove();
    yield waitWhile(() => hangerPart.moving);
    yield;
  }

  *#showBodyPart(progress) {
    yield* this.#updateTriesView(progress);
    const { mainCharacter, hanger } = this.#viewTools.world;
    const partPosition = progress.tries - hanger.parts.length - BODY_PARTS_OFFSET;
    if (partPosition === 0) {
      mainCharacter.bodyVisible = true;
      mainCharacter.currentState = animationStates.STANDING;
    } else {
      const i = bodyPartsAppearanceOrder.length - partPosition;
      mainCharacter.setBodyPartVisible(bodyPartsAppearanceOrder[i]);
    }
    yield;
  }

  *#easyModeAction(progress) {
    const hangerStage = progress.tries < triesCount.NORMAL;
    yield* hangerStage ? this.#showHangerPart(progress) : this.#showBodyPart(progress);
  }

  *#updateTriesView({ tries, difficulty }) {
    this.#viewTools.tabs.tries = formatTries(tries, difficulty);
    yield;
  }

  #placeCharacterBody() {
    const { world: { mainCharacter }, movement } = this.#viewTools;
    mainCharacter.bodyVisible = false;
    Object.assign(mainCharacter.transform, movement.center);
  }
}
