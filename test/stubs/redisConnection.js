export default class RedisConnectionStub {
  #hashes = new Map();
  quitted = false;

  async EXISTS(key) {
    return Number(this.#hashes.has(key));
  }

  async HSET(key, data) {
    const stored = { ...this.#hashes.get(key) };
    for (const field in data) stored[field] = data[field].toString();
    this.#hashes.set(key, stored);
    return Object.keys(data).length;
  }

  async HGETALL(key) {
    return { ...this.#hashes.get(key) };
  }

  async DEL(key) {
    return Number(this.#hashes.delete(key));
  }

  async KEYS(pattern) {
    const prefix = pattern.slice(0, -1);
    return [...this.#hashes.keys()].filter(k => k.startsWith(prefix));
  }

  async QUIT() {
    this.quitted = true;
  }
}
