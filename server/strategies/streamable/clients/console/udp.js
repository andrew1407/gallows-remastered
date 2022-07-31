import { runApp as runConsoleApp } from '../consoleTools.js';
import envParams from '../../../../env.json' assert { type: 'json' };

const port = envParams.udp.port ?? envParams.port + 1;
const host = envParams.udp.host ?? envParams.host;

class SocketInterfaceAdapter {
  #socket = null;
  #id = null;
  readyState = 0;

  constructor(socket) {
    this.#socket = socket;
  }

  get CLOSED() {
    return 1;
  }

  set onmessage(fn) {
    this.#socket.on('message', data => {
      if (this.#id) fn({ data });
      else this.#setId(data.toString());
    });
    if (!this.#id) this.#sendData({ initial: true });
  }

  set onclose(fn) {
    this.#socket.on('close', () => {
      this.readyState = this.CLOSED;
      fn();
    });
  }

  send(input, clb) {
    this.#sendData({ input, id: this.#id }, clb);
  }

  #sendData(data, clb = null) {
    this.#socket.send(JSON.stringify(data), port, host, clb);
  }

  #setId(data) {
    const idPrefix = 'id: ';
    console.log(data)
    if (data.startsWith(idPrefix))
      this.#id = data.slice(idPrefix.length);
  }
}

export const runApp = ({ socket, input }) => {
  const socketWrapped = new SocketInterfaceAdapter(socket);
  return runConsoleApp({ input, socket: socketWrapped });
};
