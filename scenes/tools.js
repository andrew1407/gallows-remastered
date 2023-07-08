import { difficultyLevel, triesCount } from '../difficulty.js';

export const labels = Object.freeze({
  difficulty: 'difficulty',
  prologue: 'prologue',
  gameplay: 'gameplay',
  loss: 'loss',
  win: 'win',
});

export const frameDecorator = (frames, decor) => {
  const { guessed, tries, difficulty } = decor;
  const progress = '| ' + guessed.map(l => l ?? '?').join(' | ') + ' |';
  const triesValue = difficultyLevel[difficulty] === difficultyLevel.NO_CHALLANGE ?
    tries - triesCount.NO_CHALLANGE + 10 : tries;
  const triesTitle = 'Tries: ' + triesValue;
  return frames.map(f => ({
    ...f,
    frames: f.frames.map(s => [progress, s, triesTitle].join('\n')),
  }));
};
