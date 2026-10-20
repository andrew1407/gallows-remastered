import { createServer } from 'node:http';
import { join as joinPath } from 'node:path';
import net from 'node:net'
import { WebSocketServer } from 'ws';
import dgram from 'dgram';
import { makeStaticHandler } from './static.js';
import { connections } from './strategiesTooling.js';

export const makeServer = ({ env, components, dbClient }) => {
  const { host, port } = env;
  const { strategy, connection } = components;

  const services = {
    dbClient,
    http: createServer(),
    ws: undefined,
    udp: undefined,
    tcp: undefined,
  };

  const serviceConnections = {
    [connections.ws]: () => void(services.ws = new WebSocketServer({
      server: services.http,
      path: '/' + strategy,
    })),
    [connections.udp]: () => new Promise(res => {
      services.udp = dgram.createSocket({ type: 'udp4' });
      const udpPort = env.udp?.port ?? port + 1;
      const udpHost = env.udp?.host ?? host;
      services.udp.bind(udpPort, udpHost, res);
    }),
    [connections.tcp]: () => new Promise(res => {
      services.tcp = net.createServer();
      const tcpPort = env.tcp?.port ?? port + 1;
      const tcpHost = env.tcp?.host ?? host;
      services.tcp.listen(tcpPort, tcpHost, res);
    }),
  };

  const servicesShutdown = {
    udp: () => services.udp.close(),
    tcp: () => services.tcp.close(),
    ws: () => new Promise((res, rej) => {
      services.ws.clients.forEach(c => c.close());
      services.ws.close(e => e ? rej(e) : res());
    }),
    http: () => new Promise((res, rej) => services.http.close(e => e ? rej(e) : res())),
    dbClient: () => services.dbClient.namespaceCleanup().finally(() => services.dbClient.quit()),
  };

  return {
    services,

    async launch() {
      const strategyPath = joinPath('strategies', strategy, 'services', connection + '.js');
      const { handleConnection } = await import('./' + strategyPath);
      const serveStatic = makeStaticHandler({ components, env });
      await serviceConnections[connection]?.();
      await handleConnection?.(services, serveStatic);
      await new Promise(res => services.http.listen(port, host, res));
    },

    async shutdown() {
      for (const key in servicesShutdown)
        if (services[key]) await servicesShutdown[key]();
    },
  };
};
