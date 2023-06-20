import { createServer } from 'node:http';
import { join as joinPath } from 'node:path';
import net from 'node:net'
import { WebSocketServer } from 'ws';
import dgram from 'dgram';
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
  tcp: undefined,
};

const serviceConnections = {
  [connections.ws]: () => void(services.ws = new WebSocketServer({
    server: services.http,
    path: '/' + strategy,
  })),
  [connections.udp]: () => {
    services.udp = dgram.createSocket({ type: 'udp4' });
    const udpPort = envParams.udp?.port ?? port + 1;
    const udpHost = envParams.udp?.host ?? host;
    services.udp.bind(udpPort, udpHost);
  },
  [connections.tcp]: () => {
    services.tcp = net.createServer();
    const tcpPort = envParams.tcp?.port ?? port + 1;
    const tcpHost = envParams.tcp?.host ?? host;
    services.tcp.listen(tcpPort, tcpHost);
  },
};

const redisClient = createClient({ url: redis });
await redisClient.connect();
services.dbClient = new DbClient(redisClient);
services.http = createServer();

const servicesShutdown = {
  udp: () => services.udp.close(),
  tcp: () => services.tcp.close(),
  ws: () => new Promise(async (res, rej) => {
    services.ws.clients.forEach(c => c.close());
    services.ws.close(e => e ? rej(e) : res());
  }),
  http: () => new Promise((res, rej) => services.http.close(e => e ? rej(e) : res())),
  dbClient: () => services.dbClient.namespaceCleanup().finally(() => redisClient.QUIT()),
};

const shutdownOnce = () => {
  let called = false;
  return async () => {
    if (called) return;
    called = true;
    const forceQuitDelay = 5000;
    setTimeout(process.exit, forceQuitDelay, 1).unref();
    try {
      for (const key in servicesShutdown)
        if (services[key]) await servicesShutdown[key]();
      console.log();
      process.exit(0);
    } catch (e) {
      console.error('\n', e);
      process.exit(1);
    }
  }
};

const shutdown = shutdownOnce();
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const strategyPath = joinPath('strategies', strategy, 'services', connection + '.js');
const { handleConnection } = await import('./' + strategyPath);
const serveStatic = makeStaticHandler({ strategy, connection });
serviceConnections[connection]?.();

await handleConnection?.(services, serveStatic);

services.http?.listen(port, host);
