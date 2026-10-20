import { parseInputData } from '../../loader.js';

const EVENT_NAME = 'nextStage';
const OPEN_STATE = 1;

export default class WebSocketClientStrategy {
  #address = '';
  #socket = null;
  #messageData = null;

  constructor(address) {
    this.#address = address;
  }

  async setup() {
    this.dispose();
    const socket = new WebSocket(this.#address);
    this.#socket = socket;
    this.#messageData = Promise.withResolvers();
    socket.onmessage = e => this.#messageData?.resolve(parseInputData(e.data));
    socket.onclose = () => this.#messageData?.resolve(null);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
  }

  async stageAction(input) {
    if (this.#socket?.readyState !== OPEN_STATE) return null;
    if (!this.#messageData) this.#sendInput(input);
    const response = await this.#messageData.promise;
    this.#messageData = null;
    const invalid = !response?.data || response.end || response.event !== EVENT_NAME;
    return invalid ? null : response.data;
  }

  dispose() {
    if (!this.#socket) return;
    this.#socket.onmessage = this.#socket.onclose = null;
    this.#socket.close();
    this.#socket = null;
    this.#messageData?.resolve(null);
    this.#messageData = null;
  }

  #sendInput(input) {
    this.#messageData = Promise.withResolvers();
    this.#socket.send(JSON.stringify({ event: EVENT_NAME, data: { input } }));
  }
}
