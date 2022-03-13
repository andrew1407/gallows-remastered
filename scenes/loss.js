import { loadLossMessage, loadLoss, loadLossDifficultLevel, loadHanging } from '../loaders.js';
import { loss } from './playerFormatters.js';

const loadScenes = (...loaders) => Promise.all(loaders.map(l => l()));

export const frameLoaders = {
  DIFFICULT: () => loss.DIFFICULT(loadScenes(loadLossDifficultLevel, loadLoss)),
  NORMAL: () => loss.NORMAL(loadScenes(loadHanging, loadLoss)),
  EASY: () => loss.EASY(loadScenes(loadHanging, loadLoss)),
  NO_CHALLANGE: () => loss.NO_CHALLANGE(loadLossMessage()),
};
