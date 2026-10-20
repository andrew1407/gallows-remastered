import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../../../server/setup.js';
import HttpClientStrategy from '../../../server/strategies/dataraw/clients/sprites/http.js';
import WebSocketClientStrategy from '../../../server/strategies/dataraw/clients/sprites/ws.js';
import { makeStrategyFactory } from '../../../server/strategies/dataraw/clients/sprites/strategyFactory.js';
import { FIRST_WORD_LETTERS, pickFirstWord } from '../../stubs/words.js';
import { startServer } from '../../stubs/servers.js';

const playLoss = async strategy => {
  await strategy.setup();
  const stages = [];
  for (const input of ['', 'bad', '1', 'z', 'z']) stages.push((await strategy.stageAction(input))?.stage ?? null);
  return stages;
};

describe('sprites gameplay strategies', () => {
  let loaded;
  let http;
  let ws;

  before(async () => {
    pickFirstWord();
    loaded = await loadData();
    http = await startServer({ strategy: 'dataraw', connection: 'http' });
    ws = await startServer({ strategy: 'dataraw', connection: 'ws' });
  });

  after(async () => {
    mock.restoreAll();
    await http.server.shutdown();
    await ws.server.shutdown();
  });

  it('offline: plays a whole game locally', async () => {
    const strategy = makeStrategyFactory(loaded).offline();
    assert.deepEqual(await playLoss(strategy), ['difficulty', 'difficulty', 'gameplay', 'loss', null]);
    await strategy.setup();
    await strategy.stageAction('');
    await strategy.stageAction('2');
    let progress;
    for (const letter of FIRST_WORD_LETTERS) progress = await strategy.stageAction(letter);
    assert.equal(progress.stage, 'win');
    assert.equal(progress.guessed.join(''), 'Маяковский');
    strategy.dispose();
  });

  it('http: plays against a dataraw http server', async () => {
    const strategy = makeStrategyFactory(loaded).online(`http://127.0.0.1:${http.env.port}`);
    assert.ok(strategy instanceof HttpClientStrategy);
    assert.deepEqual(await playLoss(strategy), ['difficulty', 'difficulty', 'gameplay', 'loss', null]);
  });

  it('http: fails the first stage without a server', async () => {
    const strategy = new HttpClientStrategy(async () => ({}));
    await strategy.setup();
    await assert.rejects(strategy.stageAction(''), /unavailable/);
  });

  it('ws: plays against a dataraw ws server and reconnects on setup', async () => {
    const strategy = makeStrategyFactory(loaded).online(`ws://127.0.0.1:${ws.env.port}/dataraw`);
    assert.ok(strategy instanceof WebSocketClientStrategy);
    assert.deepEqual(await playLoss(strategy), ['difficulty', 'difficulty', 'gameplay', 'loss', null]);
    assert.equal(await strategy.stageAction('z'), null);
    await strategy.setup();
    assert.equal((await strategy.stageAction('')).stage, 'difficulty');
    const pending = strategy.stageAction('2');
    strategy.dispose();
    strategy.dispose();
    assert.equal(await pending, null);
  });

  it('ws: rejects an unreachable address', async () => {
    const strategy = new WebSocketClientStrategy('ws://127.0.0.1:1/dataraw');
    await assert.rejects(strategy.setup());
    assert.equal(await strategy.stageAction(''), null);
  });

  it('rejects malformed addresses and unsupported schemes', () => {
    const factory = makeStrategyFactory(loaded);
    assert.throws(() => factory.online('address'), TypeError);
    assert.throws(() => factory.online('tcp://127.0.0.1:8080'), /unsupported scheme/);
  });
});
