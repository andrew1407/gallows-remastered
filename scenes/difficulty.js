import { triesCount } from '../difficulty.js';
import { makePlayerDataValidator } from '../gameControls.js';
import { loadDifficultySelector, loadWords } from'../loaders.js';
import { difficulty } from './playerFormatters.js';

export { makePlayerDataValidator };

export const fillDiffiultyScene = scene => Object.entries(triesCount).reduce(
  (t, [dif, val]) => t.replace(new RegExp(dif, 'g'), dif === 'NO_CHALLANGE' ? 'overmnogo' : val),
  scene
);

export const loadFrames = () => difficulty(loadDifficultySelector().then(fillDiffiultyScene));

export const handleInput = async input => makePlayerDataValidator(await loadWords())(input);
