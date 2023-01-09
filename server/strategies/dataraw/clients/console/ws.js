import { setTimeout } from 'node:timers/promises';
import { scenePlayer } from '../../../../../io/output.js';
import { makeSocketScenesIterator, makeSocketLoader, waitForSocketConnection } from '../tools.js';
import { makeFileLoader, runScenes } from '../consoleUtils.js';
import { consoleOutput, playerDataContainer } from '../../../../../extra.js';

export const runApp = async ({ socket, input }) => {
  const playerData = playerDataContainer();
  // const resourceLoader = makeSocketLoader(socket, playerData);
  const resourceLoader = makeFileLoader(playerData);
  const inform = false;
  const scenes = makeSocketScenesIterator({ resourceLoader, playerData, socket, inform });
  const playFrames = frames => scenePlayer(frames, consoleOutput, setTimeout);
  input.open();
  await waitForSocketConnection({
    socket,
    delay: setTimeout,
    pediod: 10,
    tries: 10,
  });
  await runScenes({ socket, scenes, input, playFrames });
  input.close();
};
