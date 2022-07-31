import { defineStageHandlers } from '../../../difficulty.js';
import { labels } from '../../../scenes/tools.js';

const resources = {
  [labels.difficulty]: loaded => loaded.difficulty,
  [labels.prologue]: loaded => loaded.prologue,
  [labels.gameplay]: (loaded, difficulty, tries) => loaded.stages[defineStageHandlers[difficulty](tries)],
  [labels.win]: loaded => loaded.win,
  [labels.loss]: (loaded, difficulty) => loaded.loss[difficulty],
};

export const loadRecourse = (playerData, loaded) => {
  const { stage, difficulty, tries } = playerData;
  return resources[stage](loaded, difficulty, tries);
};
