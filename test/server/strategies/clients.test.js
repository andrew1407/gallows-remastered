import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import MemoryDbClient from '../../../server/memoryDbClient.js';
import { makeFetcher, waitForSocketConnection } from '../../../server/strategies/dataraw/clients/tools.js';
import { makeInputStub } from '../../stubs/input.js';
import { captureOutput } from '../../stubs/servers.js';

const { runApp: runConsoleTools } = await import('../../../server/strategies/streamable/clients/consoleTools.js');
const { runApp: runStreamableUdp } = await import('../../../server/strategies/streamable/clients/console/udp.js');
const { handleConnection: handleStreamableTcp } = await import('../../../server/strategies/streamable/services/tcp.js');

const makeStreamSocket = () => Object.assign(new EventEmitter(), {
  written: [],
  write(data, clb) {
    this.written.push(data);
    clb?.();
  },
  destroy() {
    throw new Error('already destroyed');
  },
});

describe('client tools', () => {
  afterEach(() => mock.restoreAll());

  it('falls back to an empty payload when the server is unreachable', async () => {
    const fetcher = makeFetcher({ origin: 'http://127.0.0.1:1' });
    assert.deepEqual(await fetcher('/nextStage', {}), {});
  });

  it('gives up waiting for a socket that never opens', async () => {
    const waiting = waitForSocketConnection({ socket: { readyState: 0 }, delay: async () => {}, pediod: 1, tries: 2 });
    await assert.rejects(waiting, /wasn't not connected/);
  });

  it('stops the streamable console loop once the socket closes', async () => {
    const frames = captureOutput();
    const socket = {
      readyState: 0,
      CLOSED: 1,
      send(data, clb) {
        this.sent = data;
        this.readyState = this.CLOSED;
        clb();
      },
    };
    const input = makeInputStub(['2']);
    const running = runConsoleTools({ socket, input });
    socket.onmessage({ data: JSON.stringify({ frame: 'Difficulty', scene: 'difficulty' }) });
    await running;
    assert.equal(socket.sent, '2');
    assert.equal(input.closed, true);
    assert.ok(frames.some(f => f.startsWith('Difficulty')));
  });

  it('identifies the streamable udp client before sending input', async () => {
    captureOutput();
    const socket = Object.assign(new EventEmitter(), {
      sent: [],
      send(data, port, host, clb) {
        this.sent.push({ ...JSON.parse(data), port, host });
        if (this.sent.length === 2) this.emit('close');
        clb?.();
      },
    });
    const input = makeInputStub(['2']);
    const running = runStreamableUdp({ socket, input, env: { host: 'h', port: 1, udp: {} } });
    socket.emit('message', Buffer.from('noise'));
    socket.emit('message', Buffer.from('id: abc'));
    socket.emit('message', Buffer.from(JSON.stringify({ frame: 'Difficulty', scene: 'difficulty' })));
    await running;
    assert.deepEqual(socket.sent, [
      { initial: true, port: 2, host: 'h' },
      { input: '2', id: 'abc', port: 2, host: 'h' },
    ]);
  });

  it('closes a streamable tcp connection even when the socket is already gone', async () => {
    const services = { tcp: new EventEmitter(), http: new EventEmitter(), dbClient: new MemoryDbClient() };
    await handleStreamableTcp(services, async () => {});
    const socket = makeStreamSocket();
    services.tcp.emit('connection', socket);
    await new Promise(setImmediate);
    assert.match(JSON.parse(socket.written[0]).frame, /Difficulty:/);
    socket.emit('data', Buffer.from('2'));
    await new Promise(setImmediate);
    socket.emit('close');
    const res = { ended: false, end() { this.ended = true; } };
    services.http.emit('request', { method: 'GET' }, res);
    await new Promise(setImmediate);
    assert.equal(res.ended, true);
  });
});
