import * as loaders from '../loaders.js';
import * as formatters from '../scenes/playerFormatters.js';
import { fillDiffiultyScene } from '../scenes/difficulty.js';

const boxStages = loaded => {
  const stagesContainer = {};
  const satgesParams = {};
  for (const i in loaded)
    satgesParams[parseInt(i, 10) + 1] = {
      enumerable: true,
      get: () => formatters.gameplay(loaded[i]),
    };
  Object.defineProperties(stagesContainer, satgesParams);
  return stagesContainer;
};

const loadStages = () => {
  const firstStage = 1;
  const lastStage = 13;
  const stages = [];
  for (let i = firstStage; i <= lastStage; ++i) stages.push(i);
  return Promise.all(stages.map(loaders.loadStage)).then(boxStages);
}

export const loadData = async () => {
  const [
    win,
    lossTitle,
    difficulty,
    hanging,
    lossDifficult,
    lossMessage,
    prologue,
    words,
    stages,
  ] = await Promise.all([
    loaders.loadWin().then(formatters.win),
    loaders.loadLoss(),
    loaders.loadDifficultySelector().then(fillDiffiultyScene).then(formatters.difficulty),
    loaders.loadHanging(),
    loaders.loadLossDifficultLevel(),
    loaders.loadLossMessage().then(formatters.loss.NO_CHALLANGE),
    loaders.loadPrologue().then(formatters.prologue),
    loaders.loadWords(),
    loadStages(),
  ]);

  const defautLossScenes = [hanging, lossTitle];
  return {
    words,
    stages,
    win,
    prologue,
    difficulty,
    loss: {
      DIFFICULT: formatters.loss.DIFFICULT([lossDifficult, lossTitle]),
      NORMAL: formatters.loss.NORMAL(defautLossScenes),
      EASY: formatters.loss.EASY(defautLossScenes),
      NO_CHALLANGE: formatters.loss.NO_CHALLANGE(lossMessage),
    },
  };
};
