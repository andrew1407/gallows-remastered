const PREFIX = 'gallows';
const EXPIRE_SEC = 3600;

export default class DbClient {
  #connection = null;

  constructor(connection) {
    this.#connection = connection;
  }

  playerExists(id) {
    return this.#connection.EXISTS(`${PREFIX}:${id}`).then(n => !!n);
  }

  writePlayerData(id, data) {
    return this.#connection.HSET(`${PREFIX}:${id}`, data, { EX: EXPIRE_SEC });
  }

  readPlayerData(id) {
    return this.#connection.HGETALL(`${PREFIX}:${id}`);
  }

  removePlayer(id) {
    return this.#connection.DEL(`${PREFIX}:${id}`);
  }

  async namespaceCleanup() {
    const found = await this.#connection.KEYS(`${PREFIX}:*`);
    await Promise.all(found.map(k => this.#connection.DEL(k)));
  }
}
