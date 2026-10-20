import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as formatters from '../../../scenes/playerFormatters.js';

const frames = count => Array.from({ length: count }, (_, i) => `f${i}`);

describe('playerFormatters', () => {
  it('wraps single frames synchronously or from a promise', async () => {
    assert.deepEqual(formatters.difficulty('d'), [{ frames: ['d'] }]);
    assert.deepEqual(await formatters.gameplay(Promise.resolve('g')), [{ frames: ['g'] }]);
    assert.deepEqual(formatters.loss.NO_CHALLANGE('m'), [{ frames: ['m'] }]);
  });

  it('builds the prologue dialogue and moves', () => {
    const [dialogue, moves] = formatters.prologue(frames(5));
    assert.equal(dialogue.frames.length, 11);
    assert.deepEqual(dialogue.frames.slice(0, 3), ['f0', 'f1', 'f2']);
    assert.deepEqual(moves, { frames: ['f3', 'f4'], delays: [400], after: 1000 });
  });

  it('repeats win frames', () => {
    assert.deepEqual(formatters.win(['w']), [{ frames: ['w'], delays: [800], repeat: 100 }]);
  });

  it('builds loss scenes per difficulty', () => {
    const [hanging, title] = formatters.loss.NORMAL([frames(2), ['t']]);
    assert.deepEqual(hanging, { frames: ['f0', 'f1'], delays: [1000, 1500], after: 1000 });
    assert.deepEqual(title, { frames: ['t'], delays: [1000], before: 1500, repeat: 100 });
    assert.deepEqual(formatters.loss.EASY([['e'], ['t']])[0].frames, ['e']);
    const [shouting, moves, difficultTitle] = formatters.loss.DIFFICULT([frames(3), ['t']]);
    assert.deepEqual(shouting, { frames: ['f0'], after: 1500 });
    assert.deepEqual(moves, { frames: ['f1', 'f2'], delays: [70] });
    assert.equal(difficultTitle.repeat, 100);
  });
});
