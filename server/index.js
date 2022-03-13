import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import DbClient from './dbClient.js';
import { makeStaticHandler } from './static.js';
import { connections, defaultStrategy, parseStrategy } from './strategies.js';
import envParams from './params.json' assert { type: 'json' };

const { host, port, redis } = envParams;

const { strategy, connection } = process.argv.map(parseStrategy)
  .find(s => !!s) ?? defaultStrategy;

const services = {
  dbClient: undefined,
  http: undefined,
  ws: undefined,
};

const redisClient = createClient({ url: redis });
await redisClient.connect();
services.dbClient = new DbClient(redisClient);

const { handleConnection, requestHandler } = await import(`./${strategy}/${connection}.js`);
const serveStatic = makeStaticHandler(`${strategy}-${connection}`);
const handleGameplay = await requestHandler?.(services.dbClient);
services.http = createServer(async (req, res) => {
  await serveStatic(req, res);
  if (req.method === 'GET') return res.end();
  await handleGameplay?.(req, res);
  res.end();
});

if (connection === connections.ws)
  services.ws = new WebSocketServer({
    server: services.http,
    path: '/' + strategy,
  });

await handleConnection?.(services);
services.http.listen(port, host);
