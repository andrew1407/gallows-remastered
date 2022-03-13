import { setTimeout } from 'timers/promises';
import { scenePlayer } from '../../../../io/output.js';
import { makeSocketScenesIterator, makeSocketLoader } from '../tools.js';
import { makeFileLoader, runScenes } from '../consoleUtils.js';
import { consoleOutput, playerDataContainer } from '../../../../extra.js';

export const runApp = async ({ socket, input }) => {
  const playerData = playerDataContainer();
  const resourceLoader = makeFileLoader(playerData);
  const scenes = makeSocketScenesIterator({ resourceLoader, playerData, socket });
  const playFrames = frames => scenePlayer(frames, consoleOutput, setTimeout);
  input.open();
  await setTimeout(10);
  await runScenes({ socket, scenes, input, playFrames });
  input.close();
};
