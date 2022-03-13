import * as readline from 'readline';

const defaultOptions = {
  close: false,
};

export default class InputReader {
  #rl = null;

  open() {
    this.#rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
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
