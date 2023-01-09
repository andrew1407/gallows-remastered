import { join as joinPath } from 'node:path';
import WebSocket from 'ws';
import dgram from 'dgram';
import InputReader from '../io/input.js';
import { connections } from './strategiesTooling.js';
import { parseComponents } from './env.js';
import { makeFetcher } from './strategies/dataraw/clients//tools.js';
import envParams from './env.json' assert { type: 'json' };

const { host, port } = envParams;
const { strategy, connection } = parseComponents();

const strategyPath = joinPath('strategies', strategy, 'clients/console', connection + '.js');
const { runApp } = await import('./' + strategyPath);

const services = {
  input: undefined,
  socket: undefined,
  fetcher: undefined,
};

const serviceConnections = {
  [connections.http]: () => services.fetcher = makeFetcher({ host, port }),
  [connections.ws]: () => services.socket = new WebSocket(`ws://${host}:${port}/${strategy}`),
  [connections.udp]: () => services.socket = dgram.createSocket({ type: 'udp4' }),
};

const shutdown = () => {
  const forceQuitDelay = 2000;
  setTimeout(process.exit, forceQuitDelay, 1).unref();
  try {
    services.socket?.close();
    console.log();
    process.exit(0);
  } catch (e) {
    console.error('\n', e);
    process.exit(1);
  }
};

services.input = new InputReader({ onClose: shutdown });
serviceConnections[connection]?.();
runApp?.(services);
