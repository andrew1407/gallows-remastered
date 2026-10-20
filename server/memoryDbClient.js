const toStorageValues = data => {
  const stored = {};
  for (const field in data) stored[field] = String(data[field]);
  return stored;
};

export default class MemoryDbClient {
  #storage = new Map();

  async playerExists(id) {
    return this.#storage.has(id);
  }

  async writePlayerData(id, data) {
    this.#storage.set(id, { ...this.#storage.get(id), ...toStorageValues(data) });
  }

  async readPlayerData(id) {
    return { ...this.#storage.get(id) };
  }

  async removePlayer(id) {
    this.#storage.delete(id);
  }

  async namespaceCleanup() {
    this.#storage.clear();
  }

  async quit() {}
}
