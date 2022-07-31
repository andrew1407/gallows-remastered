import { playerDataContainer } from '../../../../../extra.js';
import { scenePlayer } from '../../../../../io/output.js';
import { delay, inputPanelSwitch, makeDataReader, runScenes, sendInput } from '../browserUtils.js';
import { makeFetchLoader, makeFetchScenesIterator } from '../tools.js';

export const runApp = async ({ fetcher, elements }) => {
  const { sendButton, inputArea, inputLabel, framePresenter } = elements;
  const playerData = playerDataContainer();
  const dataContainer = makeDataReader();
  const showFrame = frame => framePresenter.textContent = frame;
  const playFrames = frames => scenePlayer(frames, showFrame, delay);
  const resourceLoader = makeFetchLoader(fetcher, playerData);
  const scenes = makeFetchScenesIterator({ fetcher, playerData, resourceLoader });
  const inputPanel = inputPanelSwitch(elements);
  const iteratorParams = { scenes, inputLabel, inputPanel, dataContainer, playFrames };
  const sendData = () => sendInput(inputArea, dataContainer);
  inputArea.onkeypress = e => e.key === 'Enter' ? sendData() : undefined;
  sendButton.onclick = sendData;
  await runScenes(iteratorParams);
};
