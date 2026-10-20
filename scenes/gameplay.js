import { defineStageHandlers } from '../difficulty.js';
import { applyGuess } from '../gameControls.js';
import { loadStage } from '../loaders.js';
import { gameplay } from './playerFormatters.js';

export const frameLoaders = Object.freeze({
  DIFFICULT: () => gameplay(loadStage(defineStageHandlers.DIFFICULT())),
  NORMAL: tries => gameplay(loadStage(defineStageHandlers.NORMAL(tries))),
  EASY: tries => gameplay(loadStage(defineStageHandlers.EASY(tries))),
  NO_CHALLANGE: () => gameplay(loadStage(defineStageHandlers.NO_CHALLANGE())),
});

export const handleInput = applyGuess;
