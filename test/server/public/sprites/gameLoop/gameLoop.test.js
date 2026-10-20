import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import GameLoop from '../../../../../server/public/sprites/gameLoop/gameLoop.js';
import StageActivity from '../../../../../server/public/sprites/gameLoop/stageActivity.js';
import { makeTabsStub } from '../../../../stubs/sprites.js';

const makeStrategy = stages => ({
  stages: [...stages],
  inputs: [],
  setups: 0,
  disposed: 0,
  async setup() {
    ++this.setups;
  },
  async stageAction(input) {
    this.inputs.push(input);
    const stage = this.stages.shift();
    return stage && { stage };
  },
  dispose() {
    ++this.disposed;
  },
});

const makeViews = () => ({
  played: [],
  resets: 0,
  get(stage) {
    const played = this.played;
    return {
      *playActions(progress) {
        played.push(progress.stage);
        yield;
      },
    };
  },
  resetState() {
    ++this.resets;
  },
});

const makeLoop = strategyStages => {
  const tabs = makeTabsStub();
  const input = { text: '', activations: 0, activate() { ++this.activations; } };
  const activity = new StageActivity();
  const views = makeViews();
  const world = { resets: 0, resetState() { ++this.resets; } };
  const gameLoop = new GameLoop({ tabs, input, activity, views, world });
  const strategy = makeStrategy(strategyStages);
  gameLoop.setStrategy(strategy);
  const run = async promise => {
    let done = false;
    promise.then(() => void(done = true));
    for (let i = 0; i < 100 && !done; ++i) {
      activity.tick(0.1);
      await new Promise(setImmediate);
    }
    return promise;
  };
  return { gameLoop, tabs, input, activity, views, world, strategy, run };
};

describe('game loop', () => {
  it('plays non-interractive stages until an interractive one', async () => {
    const { gameLoop, tabs, input, views, strategy, run } = makeLoop(['difficulty', 'prologue', 'gameplay', 'win']);
    gameLoop.initialize();
    assert.equal(tabs.initialized, 1);
    assert.equal(gameLoop.stageExecutionAllowed, false);
    await run(gameLoop.startPlay());
    assert.deepEqual(views.played, ['difficulty']);
    assert.equal(tabs.messageVisible, true);
    assert.equal(gameLoop.formatInput('1++'), '1++');

    input.text = '';
    await gameLoop.playStage();
    input.text = '4';
    await run(gameLoop.playStage());
    assert.deepEqual(views.played, ['difficulty', 'prologue', 'gameplay']);
    assert.deepEqual(strategy.inputs, ['', '4', '4']);
    assert.equal(gameLoop.formatInput('ab'), 'b');
    assert.equal(input.activations, 3);

    input.text = 'a';
    await run(gameLoop.playStage());
    assert.deepEqual(views.played.at(-1), 'win');
  });

  it('resets the scene and restarts the strategy', async () => {
    const { gameLoop, tabs, views, world, strategy, run } = makeLoop(['difficulty', 'difficulty']);
    await gameLoop.resetState();
    assert.equal(strategy.setups, 0);
    await run(gameLoop.startPlay());
    await run(gameLoop.resetState());
    assert.deepEqual([views.resets, world.resets, tabs.resets, strategy.setups], [1, 1, 1, 2]);
  });

  it('drops a pending stage when reset mid-play and aborts cleanly', async () => {
    const { gameLoop, tabs, views, strategy, run } = makeLoop(['difficulty']);
    let release;
    strategy.stageAction = () => new Promise(resolve => void(release = resolve));
    tabs.messageVisible = true;
    const first = gameLoop.startPlay();
    await new Promise(setImmediate);
    assert.equal(gameLoop.stageExecutionAllowed, false);
    strategy.stageAction = async () => ({ stage: 'difficulty' });
    await run(gameLoop.resetState());
    release({ stage: 'gameplay' });
    await first;
    assert.deepEqual(views.played, ['difficulty']);

    gameLoop.abort();
    assert.equal(tabs.messageVisible, false);
    assert.equal(strategy.disposed, 1);
  });

  it('stops playing when a stage action is interrupted', async () => {
    const { gameLoop, activity, views, run } = makeLoop(['difficulty']);
    views.get = () => ({
      *playActions() {
        while (true) yield;
      },
    });
    const playing = gameLoop.startPlay();
    await new Promise(setImmediate);
    activity.resetState();
    await run(playing);
    assert.equal(gameLoop.stageExecutionAllowed, true);
  });
});
