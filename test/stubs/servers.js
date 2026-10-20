import { mock } from 'node:test';
import MemoryDbClient from '../../server/memoryDbClient.js';
import { makeInputStub } from './input.js';
import { mockPromiseTimers, settle } from './timers.js';

mockPromiseTimers();
const { makeServer } = await import('../../server/serverApp.js');
const { makeClient } = await import('../../server/clientApp.js');

export const HOST = '127.0.0.1';

export const startServer = async components => {
  const dbClient = new MemoryDbClient();
  const server = makeServer({
    env: { host: HOST, port: 0, udp: { port: 0 }, tcp: { port: 0 } },
    components,
    dbClient,
  });
  await server.launch();
  const { services } = server;
  const port = services.http.address().port;
  const sidePort = (services.udp ?? services.tcp)?.address().port;
  const env = { host: HOST, port, udp: { port: sidePort }, tcp: { port: sidePort } };
  return { server, dbClient, env };
};

export const captureOutput = () => {
  const frames = [];
  const write = process.stdout.write;
  mock.method(console, 'clear', () => {});
  mock.method(console, 'log', (...args) => void frames.push(args.join(' ')));
  mock.method(process.stdout, 'write', function (chunk, ...rest) {
    if (typeof chunk !== 'string') return write.call(this, chunk, ...rest);
    frames.push(chunk);
    return true;
  });
  return frames;
};

const PACE_TURNS = 5000;
const TYPING_TURNS = 20;

const prompted = frame => /Letter:|Number/.test(frame);

// Answers like a player would: only after a new frame (or input prompt) shows up, and not
// within the same few event loop turns, so in-flight server messages land first.
const makeFramesPacer = (frames, ready) => {
  let seen = 0;
  const waiting = () => frames.length === seen || !ready(frames.at(-1));
  return async () => {
    for (let turn = 0; waiting() && turn < PACE_TURNS; ++turn)
      await new Promise(setImmediate);
    for (let turn = 0; turn < TYPING_TURNS; ++turn)
      await new Promise(setImmediate);
    seen = frames.length;
  };
};

export const runConsoleClient = async ({ components, env, answers, until, streamed = false }) => {
  const frames = captureOutput();
  const ready = streamed ? prompted : () => true;
  const input = makeInputStub(answers, { pace: makeFramesPacer(frames, ready) });
  const client = makeClient({ env, components, input });
  try {
    const running = client.launch();
    running.catch(() => {});
    if (until) {
      await settle((async () => {
        while (!until(frames)) await new Promise(setImmediate);
      })());
      client.shutdown();
    }
    const finished = until ? running.catch(() => {}) : running;
    await settle(Promise.race([finished, input.done]));
  } finally {
    mock.restoreAll();
  }
  return { frames, input, client };
};
