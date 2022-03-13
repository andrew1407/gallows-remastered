import { connections, defaultStrategy, parseStrategy } from './strategies.js';
import InputReader from '../io/input.js';
import WebSocket from 'ws';
import envParams from './params.json' assert { type: 'json' };
import { makeFetcher } from './dataraw/clients/consoleUtils.js';

const { host, port } = envParams;

const { strategy, connection } = process.argv.map(parseStrategy)
  .find(s => !!s) ?? defaultStrategy;

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
