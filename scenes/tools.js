import { difficultyLevel, triesCount } from '../difficulty.js';

export const labels = Object.freeze({
  difficulty: 'difficulty',
  prologue: 'prologue',
  gameplay: 'gameplay',
  loss: 'loss',
  win: 'win',
});

const interractiveStages = Object.freeze([labels.gameplay, labels.difficulty]);

export const isInterractive = stage => interractiveStages.includes(stage);

export const formatGuessed = guessed => '| ' + guessed.map(l => l ?? '?').join(' | ') + ' |';

export const formatTries = (tries, difficulty) => (
  difficultyLevel[difficulty] === difficultyLevel.NO_CHALLANGE ? tries - triesCount.NO_CHALLANGE + 10 : tries
);

export const frameDecorator = (frames, decor) => {
  const { guessed, tries, difficulty } = decor;
  const progress = formatGuessed(guessed);
  const triesTitle = 'Tries: ' + formatTries(tries, difficulty);
  return frames.map(f => ({
    ...f,
    frames: f.frames.map(s => [progress, s, triesTitle].join('\n')),
  }));
};
