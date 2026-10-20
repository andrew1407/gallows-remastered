import { createClient } from 'redis';
import DbClient from './dbClient.js';
import { makeServer } from './serverApp.js';
import { parseComponents } from './env.js';
import envParams from './env.json' with { type: 'json' };

const redisClient = createClient({ url: envParams.redis });
await redisClient.connect();

const server = makeServer({
  env: envParams,
  components: parseComponents(envParams),
  dbClient: new DbClient(redisClient),
});

const shutdownOnce = () => {
  let called = false;
  return async () => {
    if (called) return;
    called = true;
    const forceQuitDelay = 5000;
    setTimeout(process.exit, forceQuitDelay, 1).unref();
    try {
      await server.shutdown();
      console.log();
      process.exit(0);
    } catch (e) {
      console.error('\n', e);
      process.exit(1);
    }
  };
};

const shutdown = shutdownOnce();
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await server.launch();
