import { defineStageHandlers } from '../difficulty.js';
import { guessLetters } from '../gameControls.js';
import { loadStage } from '../loaders.js';
import { gameplay } from './playerFormatters.js';

export const frameLoaders = Object.freeze({
  DIFFICULT: () => gameplay(loadStage(defineStageHandlers.DIFFICULT())),
  NORMAL: tries => gameplay(loadStage(defineStageHandlers.NORMAL(tries))),
  EASY: tries => gameplay(loadStage(defineStageHandlers.EASY(tries))),
  NO_CHALLANGE: () => gameplay(loadStage(defineStageHandlers.NO_CHALLANGE())),
});

export const handleInput = (input, playerData) => {
  const found = guessLetters(input, playerData.left, {
    multipleLetters: playerData.multipleLetters,
  });
  if (!found.length) return { tries: playerData.tries - 1 };
  const result = {
    guessed: [ ...playerData.guessed ],
    left: [ ...playerData.left ],
  };
  for (const pos of found) {
    result.guessed[pos] = result.left[pos];
    result.left[pos] = null;
  }
  return result;
};
