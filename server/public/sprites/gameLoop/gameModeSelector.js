export default class GameModeSelector {
  #options = null;
  #gameLoop = null;
  #strategyFactory = null;
  #onFailure = null;
  #starting = false;

  constructor({ options, gameLoop, strategyFactory, onFailure }) {
    this.#options = options;
    this.#gameLoop = gameLoop;
    this.#strategyFactory = strategyFactory;
    this.#onFailure = onFailure;
  }

  initialize() {
    this.#options.addressVisible = !this.#options.offline;
    this.#options.onToggle(offline => this.#toggleAction(offline));
    this.#options.onStart(() => this.startGame());
  }

  async startGame() {
    if (this.#starting) return;
    this.#starting = true;
    let strategy;
    try {
      strategy = this.#loadStrategy();
    } catch {
      return this.#deactivateStateParams();
    }
    this.#gameLoop.setStrategy(strategy);
    this.#options.visible = false;
    this.#deactivateStateParams();
    try {
      await this.#gameLoop.startPlay();
    } catch (e) {
      this.#gameLoop.abort();
      this.#options.visible = true;
      this.#onFailure?.(e);
    }
  }

  #loadStrategy() {
    const { offline, address } = this.#options;
    return offline ? this.#strategyFactory.offline() : this.#strategyFactory.online(address);
  }

  #toggleAction(offline) {
    const fieldVisible = !offline;
    this.#options.addressVisible = fieldVisible;
    if (fieldVisible) this.#options.activateAddress();
    else this.#options.address = '';
  }

  #deactivateStateParams() {
    this.#options.address = '';
    this.#starting = false;
  }
}
