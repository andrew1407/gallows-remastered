import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { triesCount } from '../../../difficulty.js';
import { formatGuessed, formatTries, frameDecorator, isInterractive, labels } from '../../../scenes/tools.js';

describe('scene tools', () => {
  it('marks difficulty and gameplay as interractive', () => {
    const expected = { difficulty: true, gameplay: true, prologue: false, loss: false, win: false };
    for (const stage in expected) assert.equal(isInterractive(labels[stage]), expected[stage]);
  });

  it('formats the guessed word and tries', () => {
    assert.equal(formatGuessed(['a', null, 'c']), '| a | ? | c |');
    assert.equal(formatTries(5, 'NORMAL'), 5);
    assert.equal(formatTries(triesCount.NO_CHALLANGE, 'NO_CHALLANGE'), 10);
  });

  it('decorates frames with progress and tries', () => {
    const decorated = frameDecorator([{ frames: ['A', 'B'], delays: [1] }], {
      guessed: ['x', null],
      tries: 3,
      difficulty: 'EASY',
    });
    assert.deepEqual(decorated, [{
      frames: ['| x | ? |\nA\nTries: 3', '| x | ? |\nB\nTries: 3'],
      delays: [1],
    }]);
  });
});
