import { findDifficulty, triesCount } from './difficulty.js';

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

export const applyGuess = (input, playerData) => {
  const found = guessLetters(input, playerData.left, {
    multipleLetters: playerData.multipleLetters,
  });
  if (!found.length) return { tries: playerData.tries - 1 };
  const result = {
    guessed: [ ...playerData.guessed ],
    left: [ ...playerData.left ],
  };
  for (const pos of found) {
    result.guessed[pos] = result.left[pos];
    result.left[pos] = null;
  }
  return result;
};
