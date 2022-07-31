import { inputMessages } from '../../../../extra.js';
import { labels } from '../../../../scenes/tools.js';

const showFrame = frame => {
  console.clear();
  process.stdout.write(frame);
};

class FramePresenter {
  #hashed = null;
  #currentScene = null;

  get #inputMessage() {
    return inputMessages[this.#currentScene]?.concat(' ') ?? '';
  }

  get #hash() {
    return this.#hashed;
  }

  set #hash(frame) {
    const shouldBeHashed = [labels.difficulty];
    const hashable = shouldBeHashed.includes(this.#currentScene);
    if (hashable && !this.#hashed) this.#hashed = this.#composeScene(frame);
    if (!hashable && this.#hashed) this.#hashed = null;
  }

  frameListener(data) {
    const { frame, scene } = JSON.parse(data);
    this.#currentScene = scene;
    this.#hash = frame;
    const output = this.#hash ?? this.#composeScene(frame);
    showFrame(output);
  }
  
  async sendInput(socket, input) {
    if (this.#hash) showFrame(this.#hash);
    const data = await input.read(this.#inputMessage);
    await new Promise((res, rej) => socket.send(data, err => err ? rej(err) : res()));
  }

  #composeScene(frame) {
    return [frame, this.#inputMessage].join('\n');
  }
}

export const runApp = async ({ socket, input }) => {
  const presenter = new FramePresenter();
  socket.onclose = () => input.close();
  socket.onmessage = e => presenter.frameListener(e.data);
  input.open();
  while (socket.readyState !== socket.CLOSED)
    await presenter.sendInput(socket, input);
  input.close();
};
