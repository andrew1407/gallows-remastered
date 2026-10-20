import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { labels } from '../../../scenes/tools.js';
import { playerDataContainer } from '../../../extra.js';
import { pickFirstWord } from '../../stubs/words.js';
import { mockPromiseTimers, resetTimers, settle, useMockTimers } from '../../stubs/timers.js';

mockPromiseTimers();
const { models } = await import('../../../scenes/templates.js');

describe('scene templates', () => {
  beforeEach(useMockTimers);
  afterEach(() => {
    resetTimers();
    mock.restoreAll();
  });

  it('plays a scene once and moves on', async () => {
    const output = [];
    const scene = models.makePlayableScene({
      output: f => output.push(f),
      loader: async () => [{ frames: ['a', 'b'], delays: [10] }],
      current: labels.prologue,
      next: labels.gameplay,
    });
    const playing = scene.setup();
    await new Promise(setImmediate);
    assert.equal(scene.next(), labels.prologue);
    await settle(playing);
    assert.equal(scene.next(), labels.gameplay);
    scene.playing = true;
    await scene.setup();
    assert.deepEqual(output, ['a', 'b']);
  });

  it('routes difficulty input to gameplay or prologue', async () => {
    pickFirstWord();
    const playerData = playerDataContainer();
    const frames = [];
    const scene = models.makeDifficultyScene(playerData, f => frames.push(f));
    await settle(scene.setup());
    await settle(scene.setup());
    assert.equal(frames.length, 2);
    const tests = { x: labels.difficulty, 2: labels.gameplay, 4: labels.prologue };
    for (const input in tests) {
      scene.passInput(input);
      assert.equal(await scene.next(), tests[input]);
    }
  });

  it('runs gameplay until win or loss', async () => {
    const frames = [];
    const playerData = playerDataContainer();
    playerData.fill({ difficulty: 'NORMAL', tries: 2, left: ['a', 'b'], guessed: [null, null], multipleLetters: true });
    const scene = models.makeGameplayScene(playerData, f => frames.push(f));
    await settle(scene.setup());
    const tests = [['a', labels.gameplay], ['z', labels.gameplay], ['b', labels.win]];
    for (const [input, next] of tests) {
      scene.passInput(input);
      assert.equal(await settle(scene.next()), next);
    }
    assert.ok(frames.at(-1).startsWith('| a | b |'));

    playerData.fill({ tries: 1, left: ['a'], guessed: [null] });
    scene.passInput('z');
    assert.equal(await settle(scene.next()), labels.loss);
  });
});
