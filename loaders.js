import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const RESOURCE_FOLDER = './resources';

const loadFile = (...dest) => readFile(join(RESOURCE_FOLDER, ...dest), 'utf-8');

const compareStageNumber = (a, b) => {
  const pattern = /^\d+\.txt$/;
  const numValues = [a, b].map(n => (
    pattern.test(n) ? parseInt(n.slice(0, -4), 10) : NaN
  ));
  if (numValues.some(isNaN)) return 0;
  return numValues.reduce((a, b) => a - b);
};

const loadFiles = async (...dest) => {
  const folder = join(RESOURCE_FOLDER, ...dest);
  const entries = (await readdir(folder))
    .sort(compareStageNumber)
    .filter(f => f.endsWith('.txt') && f !== 'message.txt');
  return Promise.all(entries.map(f => loadFile(join(...dest, f))));
};

export const loadWin = () => loadFiles('win');

export const loadLoss = async () => loadFiles('loss');

export const loadDifficultySelector = () => loadFile('difficulties.txt');

export const loadHanging = () => loadFiles('loss', 'regular');

export const loadLossDifficultLevel = () => loadFiles('loss', 'very-difficult');

export const loadLossMessage = () => loadFile('loss', 'message.txt');

export const loadPrologue = () => loadFiles('stages', 'easy');

export const loadStage = stage => loadFile('stages', `${stage}.txt`);

export const loadWords = () => loadFile('words.txt').then(raw => raw.split('\n'));
