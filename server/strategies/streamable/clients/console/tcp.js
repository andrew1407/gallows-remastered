import { runApp as runConsoleApp } from '../consoleTools.js';
import { makeMessagesReader } from '../../../../strategiesTooling.js';

class TcpSocketInterfaceAdapter {
  #socket = null;
  readyState = 0;

  constructor(socket) {
    this.#socket = socket;
  }

  get CLOSED() {
    return 1;
  }

  set onmessage(fn) {
    const readMessages = makeMessagesReader();
    this.#socket.setEncoding('utf8');
    this.#socket.on('data', chunk => {
      for (const data of readMessages(chunk)) fn({ data });
    });
  }

  set onclose(fn) {
    this.#socket.on('close', e => {
      this.readyState = this.CLOSED;
      fn(e);
    });
  }

  send(input, clb) {
    this.#socket.write(input, clb);
  }
}

export const runApp = ({ socket, input }) => {
  const socketWrapped = new TcpSocketInterfaceAdapter(socket);
  return runConsoleApp({ input, socket: socketWrapped });
};
