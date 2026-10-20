import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import GameModeSelector from '../../../../../server/public/sprites/gameLoop/gameModeSelector.js';

const makeOptions = ({ offline = true, address = '' } = {}) => ({
  offline,
  address,
  addressVisible: null,
  visible: true,
  activated: 0,
  activateAddress() {
    ++this.activated;
  },
  onToggle(fn) {
    this.toggle = fn;
  },
  onStart(fn) {
    this.start = fn;
  },
});

const makeGameLoop = ({ fails = false } = {}) => ({
  strategy: null,
  aborted: 0,
  setStrategy(strategy) {
    this.strategy = strategy;
  },
  async startPlay() {
    if (fails) throw new Error('no server');
  },
  abort() {
    ++this.aborted;
  },
});

const strategyFactory = {
  offline: () => 'offline',
  online: address => {
    if (!address.includes('://')) throw new TypeError('bad address');
    return `online ${address}`;
  },
};

describe('game mode selector', () => {
  it('toggles the address field with the offline mode', () => {
    const options = makeOptions({ address: 'typed' });
    new GameModeSelector({ options, gameLoop: makeGameLoop(), strategyFactory }).initialize();
    assert.equal(options.addressVisible, false);
    options.toggle(false);
    assert.deepEqual([options.addressVisible, options.activated], [true, 1]);
    options.toggle(true);
    assert.deepEqual([options.addressVisible, options.address], [false, '']);
  });

  it('starts an offline game and hides the options', async () => {
    const options = makeOptions();
    const gameLoop = makeGameLoop();
    new GameModeSelector({ options, gameLoop, strategyFactory }).initialize();
    await options.start();
    assert.deepEqual([gameLoop.strategy, options.visible], ['offline', false]);
  });

  it('keeps the options for an invalid address and ignores double starts', async () => {
    const options = makeOptions({ offline: false, address: 'nowhere' });
    const gameLoop = makeGameLoop();
    const selector = new GameModeSelector({ options, gameLoop, strategyFactory });
    selector.initialize();
    await selector.startGame();
    assert.deepEqual([gameLoop.strategy, options.visible, options.address], [null, true, '']);
    options.address = 'ws://host';
    const starting = selector.startGame();
    await selector.startGame();
    await starting;
    assert.equal(gameLoop.strategy, 'online ws://host');
  });

  it('reports a failed connection and shows the options again', async () => {
    const options = makeOptions({ offline: false, address: 'http://host' });
    const gameLoop = makeGameLoop({ fails: true });
    const failures = [];
    new GameModeSelector({ options, gameLoop, strategyFactory, onFailure: e => failures.push(e.message) }).initialize();
    await options.start();
    assert.deepEqual([gameLoop.aborted, options.visible, failures], [1, true, ['no server']]);
    await new GameModeSelector({ options, gameLoop, strategyFactory }).startGame();
  });
});
