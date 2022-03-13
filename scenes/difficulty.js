import { triesCount } from '../difficulty.js';
import { chooseWord, parseDifficulty } from '../gameControls.js';
import { loadDifficultySelector, loadWords } from'../loaders.js';
import { difficulty } from './playerFormatters.js';

export const fillDiffiultyScene = scene => Object.entries(triesCount).reduce(
  (t, [dif, val]) => t.replace(new RegExp(dif, 'g'), dif === 'NO_CHALLANGE' ? 'overmnogo' : val),
  scene
);

export const loadFrames = () => difficulty(loadDifficultySelector().then(fillDiffiultyScene));

export const makePlayerDataValidator = words => input => {
  let parsed;
  try {
    parsed = parseDifficulty(input);
  } catch {
    return null;
  }
  const left = [ ...chooseWord(words) ];
  const guessed = Array(left.length).fill(null);
  const tries = triesCount[parsed.difficulty];
  return { ...parsed, left, guessed, tries };
};

export const handleInput = async input => makePlayerDataValidator(await loadWords())(input);
