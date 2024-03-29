import { frameDecorator, labels } from '../../../../scenes/tools.js';

export const delay = msec => new Promise(r => setTimeout(r, msec));

export const sendInput = (inputArea, dataContainer) => {
  const input = inputArea.value;
  if (inputArea !== document.activeElement) inputArea.focus();
  if (!input) return;
  dataContainer.value = input;
  inputArea.value = '';
};

export const inputPanelSwitch = ({ inputArea, inputPanel, sendButton }) => ({
  show() {
    if (!inputArea.disabled) return;
    inputArea.disabled = false;
    sendButton.disabled = false;
    inputPanel.style.display = 'block';
    if (inputArea !== document.activeElement) inputArea.focus();
  },
  hide() {
    if (inputArea.disabled) return;
    inputArea.disabled = true;
    sendButton.disabled = true;
    inputPanel.style.display = 'none';
  },
});

export const makeInputResolver = () => {
  let resolver = null;
  const useResolver = ({ data = null, resolve = null }) => {
    resolver?.(data);
    resolver = resolve;
  };

  return {
    set value(data) {
      useResolver({ data });
    },

    get value() {
      return { then: resolve => useResolver({ resolve }) };
    }
  };
};

export const runScenes = async ({ socket, scenes, inputLabel, playFrames, dataContainer, inputPanel }) => {
  for await (const scene of scenes) {
    if (socket && socket.readyState === socket.CLOSED) break;
    if (scenes.playing) continue;
    const { frames, inputMessage, playerData } = scene;
    if (scenes.interractive(scene)) {
      inputPanel.show();
      if (inputLabel.textContent !== inputMessage)
        inputLabel.textContent = inputMessage;
      const outputFrames = playerData.stage === labels.gameplay ?
        frameDecorator(frames, playerData) : frames;
      await playFrames(outputFrames);
      const data = await dataContainer.value;
      scene.passInput(data);
    } else {
      scenes.playing = true;
      inputPanel.hide();
      await playFrames(frames);
      scenes.playing = false;
    }
  }
};
