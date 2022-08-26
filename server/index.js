import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dgram from 'dgram';
import { join as joinPath } from 'path';
import { createClient } from 'redis';
import DbClient from './dbClient.js';
import { makeStaticHandler } from './static.js';
import { connections } from './strategiesTooling.js';
import { parseComponents } from './env.js';
import envParams from './env.json' assert { type: 'json' };

const { host, port, redis } = envParams;
const { strategy, connection } = parseComponents();

const services = {
  dbClient: undefined,
  http: undefined,
  ws: undefined,
  udp: undefined,
};


const redisClient = createClient({ url: redis });
await redisClient.connect();
services.dbClient = new DbClient(redisClient);
services.http = createServer();

const shutdown = async () => {
  const closing = service => new Promise((res, rej) => (
    service ? service.close(e => e ? rej(e) : res()) : res()
  ));
  
  try {
    services.udp?.close();
    await closing(services.ws);
    await closing(services.http);
    await redisClient.FLUSHALL();
    await redisClient.QUIT();
    console.log();
    process.exit(0);
  } catch (e) {
    console.error('\n', e);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const strategyPath = joinPath('strategies', strategy, 'services', connection + '.js');
const { handleConnection } = await import('./' + strategyPath);
const serveStatic = makeStaticHandler({ strategy, connection });

if (connection === connections.ws)
  services.ws = new WebSocketServer({
    server: services.http,
    path: '/' + strategy,
  });

if (connection == connections.udp) services.udp = dgram.createSocket('udp4');

await handleConnection?.(services, serveStatic);

services.http?.listen(port, host);
if (connection === connections.udp) {
  const udpPort = envParams.udp?.port ?? port + 1;
  const udpHost = envParams.udp?.host ?? host;
  services.udp.bind(udpPort, udpHost);
}
