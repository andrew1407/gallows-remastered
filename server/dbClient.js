const expireSec = 3600;

export default class DbClient {
  #connection = null;

  constructor(connection) {
    this.#connection = connection;
  }

  playerExists(id) {
    return this.#connection.EXISTS(`gallows:${id}`).then(n => !!n);
  }

  writePlayerData(id, data) {
    return this.#connection.HSET(`gallows:${id}`, data, { EX: expireSec });
  }

  readPlayerData(id) {
    return this.#connection.HGETALL(`gallows:${id}`);
  }

  removePlayer(id) {
    return this.#connection.DEL(`gallows:${id}`);
  }
}
