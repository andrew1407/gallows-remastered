const EVENT_ROUTE = '/nextStage';

export default class HttpClientStrategy {
  #fetcher = null;
  #id = null;

  constructor(fetcher) {
    this.#fetcher = fetcher;
  }

  async setup() {
    this.#id = null;
  }

  async stageAction(input) {
    const initial = !this.#id;
    const payload = initial ? { data: { initial } } : { id: this.#id, data: { input } };
    const { end, data } = await this.#fetcher(EVENT_ROUTE, payload);
    if (initial && !data) throw new Error('game server is unavailable');
    if (end || !data) return null;
    if (initial) this.#id = data.id;
    return data;
  }

  dispose() {}
}
