import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGuess, chooseWord, guessLetters, makePlayerDataValidator, parseDifficulty,
} from '../../gameControls.js';
import { pickFirstWord } from '../stubs/words.js';

describe('gameControls', () => {
  afterEach(() => mock.restoreAll());

  it('parses difficulty input with the one letter mode switch', () => {
    const tests = {
      '1': { difficulty: 'DIFFICULT', multipleLetters: true },
      '2++': { difficulty: 'NORMAL', multipleLetters: false },
      '4': { difficulty: 'NO_CHALLANGE', multipleLetters: true },
    };
    for (const input in tests) assert.deepEqual(parseDifficulty(input), tests[input]);
    for (const input of ['5', '1+', 'a', '', '12'])
      assert.throws(() => parseDifficulty(input), /invalid data to parse/);
  });

  it('chooses a random word', () => {
    pickFirstWord();
    assert.equal(chooseWord(['a', 'b']), 'a');
  });

  it('guesses all or a single letter position case-insensitively', () => {
    const left = ['A', 'b', 'a', null];
    assert.deepEqual(guessLetters('a', left, { multipleLetters: true }), ['0', '2']);
    assert.deepEqual(guessLetters('A', left, { multipleLetters: false }), ['0']);
    assert.deepEqual(guessLetters('z', left), []);
    assert.deepEqual(guessLetters(undefined, [null]), ['0']);
  });

  it('creates player data from a valid difficulty only', () => {
    pickFirstWord();
    const validate = makePlayerDataValidator(['ab']);
    assert.equal(validate('9'), null);
    assert.deepEqual(validate('2'), {
      difficulty: 'NORMAL',
      multipleLetters: true,
      left: ['a', 'b'],
      guessed: [null, null],
      tries: 7,
    });
  });

  it('applies a guess or spends a try', () => {
    const playerData = { left: ['a', 'b', 'a'], guessed: [null, null, null], tries: 3, multipleLetters: true };
    assert.deepEqual(applyGuess('z', playerData), { tries: 2 });
    assert.deepEqual(applyGuess('a', playerData), { left: [null, 'b', null], guessed: ['a', null, 'a'] });
    assert.deepEqual(playerData.left, ['a', 'b', 'a']);
  });
});
