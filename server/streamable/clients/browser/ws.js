import { labels } from '../../../../scenes/tools.js';
import { inputMessages } from '../../../../extra.js';

const sendInput = (socket, inputArea) => {
  const input = inputArea.value;
  if (inputArea !== document.activeElement) inputArea.focus();
  if (!input) return;
  socket.send(input);
  inputArea.value = '';
};

const makeMessageListener = elements => e => {
  const { framePresenter, inputPanel, sendButton, inputArea, inputLabel } = elements;
  const { frame, scene } = JSON.parse(e.data);
  if (!frame) return;
  framePresenter.innerHTML = frame;
  const difStage = scene === labels.difficulty;
  const gameplayStage = scene === labels.gameplay;
  const interractiveScene = difStage || gameplayStage;
  const shouldEnableInput = interractiveScene && inputArea.disabled;
  const shouldDisableInput = !(interractiveScene || inputArea.disabled);
  if (shouldEnableInput) {
    inputArea.disabled = false;
    sendButton.disabled = false;
    inputPanel.style.display = 'block';
    if (inputArea !== document.activeElement) inputArea.focus();
  }
  if (shouldDisableInput) {
    inputArea.disabled = true;
    sendButton.disabled = true;
    inputPanel.style.display = 'none';
  }
  const difLabel = inputMessages[labels.difficulty];
  const gameplayLabel = inputMessages[labels.gameplay];
  if (difStage && inputLabel.textContent !== difLabel)
    inputLabel.textContent = difLabel;
  if (gameplayStage && inputLabel.textContent !== gameplayLabel)
    inputLabel.textContent = gameplayLabel;
};

export const runApp = ({ socket, elements }) => {
  const { sendButton, inputArea } = elements;
  socket.onmessage = makeMessageListener(elements);
  const sendData = () => sendInput(socket, inputArea);
  inputArea.onkeypress = e => e.key === 'Enter' ? sendData() : undefined;
  sendButton.onclick = sendData;
};
