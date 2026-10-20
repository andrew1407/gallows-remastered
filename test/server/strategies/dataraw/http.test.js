import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../../../stubs/servers.js';
import { pickFirstWord } from '../../../stubs/words.js';

describe('dataraw http service', () => {
  let server;
  let dbClient;
  let origin;

  const post = async (route, body) => {
    const res = await fetch(origin + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await res.text();
    return [res.status, text ? JSON.parse(text) : null];
  };

  const start = async () => {
    const [, { data }] = await post('/nextStage', { data: { initial: true } });
    return data.id;
  };

  before(async () => {
    pickFirstWord();
    ({ server, dbClient } = await startServer({ strategy: 'dataraw', connection: 'http' }));
    origin = `http://127.0.0.1:${server.services.http.address().port}`;
  });

  after(async () => {
    mock.restoreAll();
    await server.shutdown();
  });

  it('serves the page and answers CORS preflights', async () => {
    const page = await fetch(origin + '/');
    assert.match(await page.text(), /sprites-version/);
    const preflight = await fetch(origin + '/nextStage', { method: 'OPTIONS' });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
    assert.equal(preflight.headers.get('access-control-allow-private-network'), 'true');
  });

  it('rejects unknown routes, empty bodies and unknown players', async () => {
    const tests = [
      ['/unknown', { data: {} }, 404],
      ['/nextStage', 'not json', 403],
      ['/resource', { data: { input: 'a' } }, 403],
      ['/nextStage', { id: 'missing', data: {} }, 404],
    ];
    for (const [route, body, status] of tests)
      assert.equal((await post(route, body))[0], status, route);
  });

  it('serves stats and resources for a player', async () => {
    const id = await start();
    const [, stats] = await post('/currentStats', { id });
    assert.deepEqual(stats, { data: { stage: 'difficulty' } });
    const [, resource] = await post('/resource', { id, data: {} });
    assert.match(resource.data[0].frames[0], /Difficulty:/);
  });

  it('walks the prologue into gameplay', async () => {
    const id = await start();
    const [, prologue] = await post('/nextStage', { id, data: { input: '4' } });
    assert.equal(prologue.data.stage, 'prologue');
    assert.equal((await post('/resource', { id, data: {} }))[1].data.length, 2);
    const [, gameplay] = await post('/nextStage', { id, data: { input: '' } });
    assert.equal(gameplay.data.stage, 'gameplay');
  });

  it('loses, serves the loss scene and ends the session', async () => {
    const id = await start();
    await post('/nextStage', { id, data: { input: '1' } });
    const [, loss] = await post('/nextStage', { id, data: { input: 'z' } });
    assert.equal(loss.data.stage, 'loss');
    assert.equal((await post('/resource', { id, data: {} }))[1].data.length, 3);
    assert.deepEqual((await post('/nextStage', { id, data: { input: 'z' } }))[1], { end: true });
    assert.equal(await dbClient.playerExists(id), false);
  });

  it('ignores a stage request while the previous one is playing', async () => {
    const id = await start();
    await dbClient.writePlayerData(id, { playing: true });
    assert.deepEqual((await post('/nextStage', { id, data: { input: '1' } }))[1], { end: false });
  });
});
