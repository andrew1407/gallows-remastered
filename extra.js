import { labels } from './scenes/tools.js';

export const playerDataContainer = () => ({
  fill(fields) {
    for (const field in fields) this[field] = fields[field];
  }
});

export const consoleOutput = data => {
  console.clear();
  console.log(data);
};

export const inputMessages = {
  [labels.difficulty]: 'Number (add \'++\' to turn on \'guess one letter only\' mode):',
  [labels.gameplay]: 'Letter:',
};
