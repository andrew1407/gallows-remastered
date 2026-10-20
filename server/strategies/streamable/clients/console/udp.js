import { runApp as runConsoleApp } from '../consoleTools.js';

class UdpSocketInterfaceAdapter {
  #socket = null;
  #id = null;
  #address = null;
  readyState = 0;

  constructor(socket, address) {
    this.#socket = socket;
    this.#address = address;
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
    this.#socket.on('close', e => {
      this.readyState = this.CLOSED;
      fn(e);
    });
  }

  send(input, clb) {
    this.#sendData({ input, id: this.#id }, clb);
  }

  #sendData(data, clb = null) {
    const { port, host } = this.#address;
    this.#socket.send(JSON.stringify(data), port, host, clb);
  }

  #setId(data) {
    const idPrefix = 'id: ';
    console.log(data)
    if (data.startsWith(idPrefix))
      this.#id = data.slice(idPrefix.length);
  }
}

export const runApp = ({ socket, input, env }) => {
  const port = env.udp?.port ?? env.port + 1;
  const host = env.udp?.host ?? env.host;
  const socketWrapped = new UdpSocketInterfaceAdapter(socket, { port, host });
  return runConsoleApp({ input, socket: socketWrapped });
};
