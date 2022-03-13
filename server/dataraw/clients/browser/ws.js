import { scenePlayer } from '../../../../io/output.js';
import { makeSocketScenesIterator, makeSocketLoader } from '../tools.js';
import { delay, inputPanelSwitch, makeDataReader, runScenes, sendInput } from '../browserUtils.js';
import { playerDataContainer } from '../../../../extra.js';

export const runApp = async ({ socket, elements }) => {
  const { sendButton, inputArea, inputLabel, framePresenter } = elements;
  const playerData = playerDataContainer();
  const dataContainer = makeDataReader();
  const showFrame = frame => framePresenter.textContent = frame;
  const playFrames = frames => scenePlayer(frames, showFrame, delay);
  const resourceLoader = makeSocketLoader(socket);
  const scenes = makeSocketScenesIterator({ playerData, socket, resourceLoader });
  const inputPanel = inputPanelSwitch(elements);
  const sendData = () => sendInput(inputArea, dataContainer);
  inputArea.onkeypress = e => e.key === 'Enter' ? sendData() : undefined;
  sendButton.onclick = sendData;
  const iteratorParams = { socket, scenes, inputLabel, inputPanel, dataContainer, playFrames };
  await delay(10);
  await runScenes(iteratorParams);
};
