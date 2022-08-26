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
const clientResources = {
  input: new InputReader(),
  socket: undefined,
  fetcher: undefined,
};
if (connection === connections.ws)
  clientResources.socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
else if (connection === connections.udp)
  clientResources.socket = dgram.createSocket('udp4');
else
  clientResources.fetcher = makeFetcher({ host, port });
  
runApp?.(clientResources);
