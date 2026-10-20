import * as readline from 'node:readline';

const defaultOptions = {
  close: false,
};

export default class InputReader {
  #rl = null;
  #onClose = null;
  #streams = null;

  constructor({ onClose, input = process.stdin, output = process.stdout } = {}) {
    this.#onClose = onClose;
    this.#streams = { input, output };
  }

  open() {
    this.#rl = readline.createInterface(this.#streams);
    
    if (this.#onClose) this.#rl.on('close', this.#onClose);
  }

  close() {
    this.#rl?.close();
  }

  read(message, options) {
    const { close } = { ...defaultOptions, ...options };
    return new Promise(res => {
      this.#rl?.question(message ?? '', input => {
        if (close) this.close();
        res(input);
      })
    });
  }
}
