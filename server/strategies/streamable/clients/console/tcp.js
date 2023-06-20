import { runApp as runConsoleApp } from '../consoleTools.js';

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
    this.#socket.on('data', data =>  fn({ data }));
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
