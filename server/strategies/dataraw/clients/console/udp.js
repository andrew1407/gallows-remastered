import { makeSocketLoader, SocketInterfaceAdapter } from '../tools.js';
import { makeFileLoader, makeAppLauncher } from '../consoleUtils.js';

export const runApp = ({ env, ...services }) => {
  const port = env.udp?.port ?? env.port + 1;
  const host = env.udp?.host ?? env.host;
  const launchApp = makeAppLauncher({
    adapter: socket => new SocketInterfaceAdapter({
      socket,
      dataEvent: 'message',
      sendAction: (socket, data) => socket.send(data, port, host),
    }),
    loaderFactory: ({ socket, playerData }) => makeSocketLoader(socket, playerData),
    // loaderFactory: ({ playerData }) => makeFileLoader(playerData),
  });
  return launchApp(services);
};
