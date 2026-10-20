import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../../server/setup.js';

describe('setup', () => {
  it('preloads every resource the strategies serve', async () => {
    const loaded = await loadData();
    assert.equal(loaded.words.length, 13);
    assert.deepEqual(Object.keys(loaded.stages).map(Number), Array.from({ length: 13 }, (_, i) => i + 1));
    assert.equal(loaded.stages[7][0].frames.length, 1);
    assert.equal(loaded.prologue.length, 2);
    assert.equal(loaded.win[0].repeat, 100);
    assert.match(loaded.difficulty[0].frames[0], /overmnogo/);
    assert.deepEqual(Object.keys(loaded.loss), ['DIFFICULT', 'NORMAL', 'EASY', 'NO_CHALLANGE']);
    assert.ok(JSON.parse(JSON.stringify(loaded)).stages['1']);
  });
});
