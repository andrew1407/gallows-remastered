import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defineStageHandlers, difficultyLevel, findDifficulty, triesCount } from '../../difficulty.js';

describe('difficulty', () => {
  it('finds a difficulty label by its level', () => {
    for (const label in difficultyLevel)
      assert.equal(findDifficulty(difficultyLevel[label]), label);
    assert.equal(findDifficulty(5), null);
  });

  it('maps tries left to the stage frame', () => {
    const stages = {
      DIFFICULT: [1, 7],
      NORMAL: [7, 7],
      EASY: [13, 1],
      NO_CHALLANGE: [triesCount.NO_CHALLANGE, 1],
    };
    for (const label in stages) {
      const [tries, stage] = stages[label];
      assert.equal(defineStageHandlers[label](tries), stage);
    }
  });
});
