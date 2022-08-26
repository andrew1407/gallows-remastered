import WebSocket from 'ws';
import dgram from 'dgram';
import { join as joinPath } from 'path';
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

const shutdown = async () => {
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

if (connection === connections.ws)
  services.socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
else if (connection === connections.udp)
  services.socket = dgram.createSocket('udp4');
else
  services.fetcher = makeFetcher({ host, port });
  
runApp?.(services);
