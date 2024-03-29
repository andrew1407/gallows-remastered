import { makeSocketLoader, SocketInterfaceAdapter } from '../tools.js';
import { makeFileLoader, makeAppLauncher } from '../consoleUtils.js';
import envParams from '../../../../env.json' assert { type: 'json' };

const port = envParams.udp.port ?? envParams.port + 1;
const host = envParams.udp.host ?? envParams.host;

export const runApp = makeAppLauncher({
  adapter: socket => new SocketInterfaceAdapter({
    socket,
    dataEvent: 'message',
    sendAction: (socket, data) => socket.send(data, port, host),
  }),
  loaderFactory: ({ socket, playerData }) => makeSocketLoader(socket, playerData),
  // loaderFactory: ({ playerData }) => makeFileLoader(playerData),
});
