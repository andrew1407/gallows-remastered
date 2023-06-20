import { join as joinPath } from 'node:path';
import { Socket } from 'node:net';
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
  [connections.http]: () => void(services.fetcher = makeFetcher({ host, port })),
  [connections.ws]: () => void(services.socket = new WebSocket(`ws://${host}:${port}/${strategy}`)),
  [connections.udp]: () => void(services.socket = dgram.createSocket({ type: 'udp4' })),
  [connections.tcp]: () => new Promise(r => {
    services.socket = new Socket();
    const tcpPort = envParams.tcp?.port ?? port + 1;
    const tcpHost = envParams.tcp?.host ?? host;
    services.socket.connect(tcpPort, tcpHost, r);
  }),
};

const shutdown = () => {
  const forceQuitDelay = 2000;
  setTimeout(process.exit, forceQuitDelay, 1).unref();
  try {
    services.socket?.close?.();
    services.socket?.destroy?.();
    console.log();
    process.exit(0);
  } catch (e) {
    console.error('\n', e);
    process.exit(1);
  }
};

services.input = new InputReader({ onClose: shutdown });
await serviceConnections[connection]?.();
runApp?.(services);
