import { isInterractive, labels } from '../../../../scenes/tools.js';

const makeLoopState = () => ({
  resetting: false,
  formatInput: false,
  playing: false,
});

export default class GameLoop {
  #tabs = null;
  #input = null;
  #activity = null;
  #views = null;
  #world = null;
  #strategy = null;
  #session = 0;
  #state = makeLoopState();

  constructor({ tabs, input, activity, views, world }) {
    this.#tabs = tabs;
    this.#input = input;
    this.#activity = activity;
    this.#views = views;
    this.#world = world;
  }

  get #gameStarted() {
    return this.#tabs.messageVisible;
  }

  get resetAllowed() {
    return !this.#state.resetting && this.#gameStarted;
  }

  get stageExecutionAllowed() {
    return !this.#state.resetting && !this.#state.playing && this.#gameStarted;
  }

  initialize() {
    this.#tabs.initialize();
  }

  setStrategy(strategy) {
    this.#strategy = strategy;
  }

  formatInput(value) {
    return this.#state.formatInput && value.length > 1 ? value.at(-1) : value;
  }

  async resetState() {
    if (!this.resetAllowed) return;
    this.#state.resetting = true;
    if (this.#state.playing) this.#activity.resetState();
    this.#views.resetState();
    this.#world.resetState();
    this.#tabs.resetState();
    this.#state = makeLoopState();
    await this.startPlay();
  }

  async startPlay() {
    this.#tabs.messageVisible = true;
    this.#tabs.guessingVisible = false;
    await this.#strategy.setup();
    await this.#playActions('');
  }

  async playStage() {
    if (!this.stageExecutionAllowed) return;
    const input = this.#input.text;
    if (!input) return;
    await this.#playActions(input);
  }

  abort() {
    ++this.#session;
    this.#state = makeLoopState();
    this.#tabs.messageVisible = false;
    this.dispose();
  }

  dispose() {
    this.#strategy?.dispose();
  }

  async #playActions(input) {
    if (this.#state.playing) return;
    this.#state.playing = true;
    const session = ++this.#session;
    let interractive = false;
    try {
      while (!interractive) interractive = await this.#runStage(input, session);
    } finally {
      if (session === this.#session) this.#state.playing = false;
    }
  }

  async #runStage(input, session) {
    const progress = await this.#strategy.stageAction(input);
    if (session !== this.#session) return true;
    const stage = progress?.stage;
    this.#state.formatInput = stage !== labels.difficulty;
    this.#input.text = '';
    this.#input.activate();
    if (!stage) return true;
    const action = this.#views.get(stage).playActions(progress);
    const finished = await this.#activity.awaitActionFinish(action);
    if (!finished) return true;
    return isInterractive(stage);
  }
}
