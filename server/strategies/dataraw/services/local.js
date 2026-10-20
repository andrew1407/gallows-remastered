import MemoryDbClient from '../../../memoryDbClient.js';
import { makeResources, makeRouter } from '../routes.js';

const transfer = data => JSON.parse(JSON.stringify(data));

export const makeLocalFetcher = (loaded, dbClient = new MemoryDbClient()) => {
  const router = makeRouter(dbClient, makeResources(loaded));
  return async (route, data) => {
    const [, body] = await router(route, transfer(data ?? {}));
    return body ? transfer(body) : {};
  };
};
