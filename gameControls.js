import { findDifficulty } from './difficulty.js';

export const parseDifficulty = data => {
  const inputPattern = /^[1-4]{1}(\+\+)?$/;
  if (!inputPattern.test(data)) throw new Error('invalid data to parse');
  return {
    difficulty: findDifficulty(parseInt(data[0], 10)),
    multipleLetters: !data.endsWith('++'),
  };
};

export const chooseWord = words => words[Math.floor(Math.random() * words.length)];

export const guessLetters = (letter, leftLetterts, options) => {
  const { multipleLetters } = { ...options };
  const positions = [];
  for (const i in leftLetterts) {
    const l = leftLetterts[i];
    if (letter?.toLowerCase() === l?.toLowerCase()) {
      positions.push(i);
      if (!multipleLetters) return positions;
    }
  }
  return positions;
};
