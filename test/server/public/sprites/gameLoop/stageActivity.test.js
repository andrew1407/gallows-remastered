import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import StageActivity, { waitForSeconds, waitUntil, waitWhile } from '../../../../../server/public/sprites/gameLoop/stageActivity.js';

describe('stage activity', () => {
  it('runs coroutines frame by frame with yield instructions', async () => {
    const activity = new StageActivity();
    const log = [];
    let flag = false;
    function* nested() {
      log.push('nested');
      yield;
    }
    function* action() {
      log.push('start');
      yield waitForSeconds(1);
      log.push('waited');
      yield waitUntil(() => flag);
      log.push('until');
      yield waitWhile(() => flag);
      yield* nested();
      log.push('end');
    }
    const finished = activity.awaitActionFinish(action());
    assert.deepEqual(log, ['start']);
    activity.tick(0.6);
    activity.tick(0.6);
    assert.deepEqual(log, ['start', 'waited']);
    activity.tick(0.1);
    flag = true;
    activity.tick(0.1);
    flag = false;
    activity.tick(0.1);
    activity.tick(0.1);
    assert.equal(await finished, true);
    assert.deepEqual(log, ['start', 'waited', 'until', 'nested', 'end']);
  });

  it('stops every running coroutine on reset', async () => {
    const activity = new StageActivity();
    function* endless() {
      while (true) yield;
    }
    const finished = activity.awaitActionFinish(endless());
    activity.resetState();
    activity.tick(1);
    assert.equal(await finished, false);
  });
});
