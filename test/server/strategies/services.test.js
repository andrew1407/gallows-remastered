import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import dgram from 'node:dgram';
import WebSocket from 'ws';
import { FIRST_WORD_LETTERS, pickFirstWord } from '../../stubs/words.js';
import { resetTimers, settle, useMockTimers } from '../../stubs/timers.js';
import { runConsoleClient, startServer } from '../../stubs/servers.js';

const connections = {
  dataraw: ['ws', 'tcp', 'udp'],
  streamable: ['ws', 'tcp', 'udp'],
};

describe('socket services', () => {
  beforeEach(() => {
    useMockTimers();
    pickFirstWord();
  });
  afterEach(() => {
    resetTimers();
    mock.restoreAll();
  });

  for (const strategy in connections)
    for (const connection of connections[strategy])
      it(`${strategy} ${connection}: still serves the page`, async () => {
        const { server, env } = await startServer({ strategy, connection });
        const res = await fetch(`http://127.0.0.1:${env.port}/`);
        assert.match(await res.text(), /ascii-version/);
        await server.shutdown();
      });

  it('closes connected websocket clients on shutdown', async () => {
    const { server, env } = await startServer({ strategy: 'streamable', connection: 'ws' });
    const socket = new WebSocket(`ws://127.0.0.1:${env.port}/streamable`);
    await new Promise(res => socket.once('message', res));
    const closed = new Promise(res => socket.once('close', res));
    await server.shutdown();
    await settle(closed);
  });

  it('dataraw ws: loses a normal game with file frames', async () => {
    const components = { strategy: 'dataraw', connection: 'ws' };
    const { server, env } = await startServer(components);
    const { frames } = await runConsoleClient({ components, env, answers: ['2', ...'zqwrtyu'] });
    assert.ok(frames.some(f => f.includes('Tries: 1')));
    await server.shutdown();
  });

  it('streamable ws: loses a difficult game', async () => {
    const components = { strategy: 'streamable', connection: 'ws' };
    const { server, env } = await startServer(components);
    const { frames, input } = await runConsoleClient({ components, env, answers: ['1', 'z'], streamed: true });
    assert.equal(input.closed, true);
    assert.ok(frames.length > 10);
    await server.shutdown();
  });

  it('streamable udp: streams a whole game over raw datagrams', async () => {
    const { server, env } = await startServer({ strategy: 'streamable', connection: 'udp' });
    const client = dgram.createSocket('udp4');
    const messages = [];
    client.on('message', data => messages.push(data.toString()));
    const send = data => new Promise(res => client.send(typeof data === 'string' ? data : JSON.stringify(data), env.udp.port, '127.0.0.1', res));
    const received = count => settle((async () => {
      while (messages.length < count) await new Promise(setImmediate);
    })());

    await send('not json');
    await send({ initial: true });
    await received(2);
    const id = messages[0].slice('id: '.length);
    assert.match(JSON.parse(messages[1]).frame, /Difficulty:/);

    await send({ id: 'missing', input: '2' });
    await send({ id, input: 'x' });
    await send({ id, input: '2' });
    await received(3);
    assert.equal(JSON.parse(messages.at(-1)).scene, 'gameplay');
    for (const letter of FIRST_WORD_LETTERS) {
      const count = messages.length;
      await send({ id, input: letter });
      await received(count + 1);
    }
    let streamed = 0;
    await settle((async () => {
      for (let quiet = 0; quiet < 50; ++quiet) {
        await new Promise(setImmediate);
        if (messages.length !== streamed) quiet = 0;
        streamed = messages.length;
      }
    })());
    assert.ok(messages.slice(1).some(m => JSON.parse(m).scene === 'win'));
    client.close();
    await server.shutdown();
  });
});
