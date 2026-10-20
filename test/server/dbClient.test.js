import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import DbClient from '../../server/dbClient.js';
import MemoryDbClient from '../../server/memoryDbClient.js';
import RedisConnectionStub from '../stubs/redisConnection.js';

const makeClients = () => ({
  redis: new DbClient(new RedisConnectionStub()),
  memory: new MemoryDbClient(),
});

describe('db clients', () => {
  const clients = makeClients();
  for (const label in clients) {
    const dbClient = clients[label];

    it(`${label}: stores player hashes as strings`, async () => {
      assert.equal(await dbClient.playerExists('a'), false);
      await dbClient.writePlayerData('a', { stage: 'gameplay', tries: 7, playing: false });
      await dbClient.writePlayerData('a', { tries: 6 });
      assert.equal(await dbClient.playerExists('a'), true);
      assert.deepEqual(await dbClient.readPlayerData('a'), { stage: 'gameplay', tries: '6', playing: 'false' });
      assert.deepEqual(await dbClient.readPlayerData('missing'), {});
    });

    it(`${label}: removes players and cleans the namespace up`, async () => {
      await dbClient.writePlayerData('b', { stage: 'win' });
      await dbClient.removePlayer('a');
      assert.equal(await dbClient.playerExists('a'), false);
      await dbClient.namespaceCleanup();
      assert.equal(await dbClient.playerExists('b'), false);
      await dbClient.quit();
    });
  }

  it('quits the redis connection', async () => {
    const connection = new RedisConnectionStub();
    await new DbClient(connection).quit();
    assert.equal(connection.quitted, true);
  });
});
