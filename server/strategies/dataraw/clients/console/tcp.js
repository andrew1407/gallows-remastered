import { makeSocketLoader, SocketInterfaceAdapter } from '../tools.js';
import { makeFileLoader, makeAppLauncher } from '../consoleUtils.js';

export const runApp = makeAppLauncher({
  adapter: socket => new SocketInterfaceAdapter({
    socket,
    dataEvent: 'data',
    sendAction: (socket, data) => socket.write(data),
  }),
  loaderFactory: ({ socket, playerData }) => makeSocketLoader(socket, playerData),
  // loaderFactory: ({ playerData }) => makeFileLoader(playerData),
});
