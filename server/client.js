import InputReader from '../io/input.js';
import { makeClient } from './clientApp.js';
import { parseComponents } from './env.js';
import envParams from './env.json' with { type: 'json' };

const shutdown = () => {
  const forceQuitDelay = 2000;
  setTimeout(process.exit, forceQuitDelay, 1).unref();
  try {
    client.shutdown();
    console.log();
    process.exit(0);
  } catch (e) {
    console.error('\n', e);
    process.exit(1);
  }
};

const client = makeClient({
  env: envParams,
  components: parseComponents(envParams),
  input: new InputReader({ onClose: shutdown }),
});

await client.launch();
