import { setTimeout } from 'timers/promises';
import { consoleOutput, playerDataContainer } from '../../../../../extra.js';
import { scenePlayer } from '../../../../../io/output.js';
import { makeFileLoader, runScenes } from '../consoleUtils.js';
import { makeFetchLoader, makeFetchScenesIterator } from '../tools.js';

export const runApp = async ({ fetcher, input }) => {
  const playerData = playerDataContainer();
  // const resourceLoader = makeFileLoader(playerData);
  const resourceLoader = makeFetchLoader(fetcher, playerData);
  const scenes = makeFetchScenesIterator({ resourceLoader, playerData, fetcher });
  const playFrames = frames => scenePlayer(frames, consoleOutput, setTimeout);
  input.open();
  await runScenes({ scenes, input, playFrames });
  input.close();
};
