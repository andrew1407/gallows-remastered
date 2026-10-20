import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scenePlayer } from '../../../io/output.js';

describe('scenePlayer', () => {
  it('streams frames with delays, repeats and before/after pauses', async () => {
    const events = [];
    const streamer = async frame => void events.push(frame);
    const delay = async ms => void events.push(ms);
    await scenePlayer([
      { frames: ['a', 'b', 'c'], delays: [1, 2], before: 10, after: 20 },
      { frames: ['x'], delays: [5], repeat: 2 },
      { frames: ['z'] },
    ], streamer, delay);
    assert.deepEqual(events, [10, 'a', 1, 'b', 2, 'c', 20, 'x', 5, 'x', 5, 'z']);
  });

  it('tolerates missing streamer and delay', async () => {
    await scenePlayer([{ frames: ['a'], delays: [1], before: 1, after: 1 }]);
  });
});
