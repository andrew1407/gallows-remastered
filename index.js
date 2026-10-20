import InputReader from './io/input.js';
import { runConsoleApp } from './consoleApp.js';

const input = new InputReader({
  onClose: () => {
    console.log();
    process.exit(0);
  },
});

await runConsoleApp({ input });
