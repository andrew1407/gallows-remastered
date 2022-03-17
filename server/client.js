import WebSocket from 'ws';
import InputReader from '../io/input.js';
import { connections } from './strategies.js';
import { parseComponents } from './env.js';
import { makeFetcher } from './dataraw/clients/consoleUtils.js';
import envParams from './params.json' assert { type: 'json' };

const { host, port } = envParams;

const { strategy, connection } = parseComponents();

const { runApp } = await import(`./${strategy}/clients/console/${connection}.js`);
const clientResources = {
  input: new InputReader(),
  socket: undefined,
  fetcher: undefined,
};
if (connection === connections.ws)
  clientResources.socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
else
  clientResources.fetcher = makeFetcher({ host, port });
runApp(clientResources);
