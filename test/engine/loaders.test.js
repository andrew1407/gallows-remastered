import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as loaders from '../../loaders.js';

describe('loaders', () => {
  it('loads every resource set in stage order', async () => {
    const tests = {
      loadWin: 2,
      loadLoss: 3,
      loadHanging: 3,
      loadLossDifficultLevel: 10,
      loadPrologue: 12,
    };
    for (const loader in tests) {
      const frames = await loaders[loader]();
      assert.equal(frames.length, tests[loader], loader);
      assert.ok(frames.every(f => typeof f === 'string' && f.length));
    }
  });

  it('loads single resources', async () => {
    assert.match(await loaders.loadDifficultySelector(), /^Difficulty:/);
    assert.match(await loaders.loadLossMessage(), /P\.S\./);
    assert.equal(await loaders.loadStage(7), await loaders.loadStage('7'));
    const words = await loaders.loadWords();
    assert.equal(words.length, 13);
    assert.equal(words[8], 'Fedora');
  });
});
