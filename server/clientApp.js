import { join as joinPath } from 'node:path';
import { Socket } from 'node:net';
import WebSocket from 'ws';
import dgram from 'dgram';
import { connections } from './strategiesTooling.js';
import { makeFetcher } from './strategies/dataraw/clients/tools.js';

export const makeClient = ({ env, components, input }) => {
  const { host, port } = env;
  const { strategy, connection } = components;

  const services = {
    env,
    input,
    socket: undefined,
    fetcher: undefined,
  };

  const serviceConnections = {
    [connections.http]: () => void(services.fetcher = makeFetcher({ host, port })),
    [connections.ws]: () => new Promise((res, rej) => {
      services.socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
      services.socket.once('open', res);
      services.socket.once('error', rej);
    }),
    [connections.udp]: () => void(services.socket = dgram.createSocket({ type: 'udp4' })),
    [connections.tcp]: () => new Promise(r => {
      services.socket = new Socket();
      const tcpPort = env.tcp?.port ?? port + 1;
      const tcpHost = env.tcp?.host ?? host;
      services.socket.connect(tcpPort, tcpHost, r);
    }),
  };

  return {
    services,

    async launch() {
      const strategyPath = joinPath('strategies', strategy, 'clients/console', connection + '.js');
      const { runApp } = await import('./' + strategyPath);
      await serviceConnections[connection]?.();
      await runApp?.(services);
    },

    shutdown() {
      services.socket?.close?.();
      services.socket?.destroy?.();
    },
  };
};
