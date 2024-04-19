import VisualSettings from './visualSettings.js';
import { connections } from '../strategiesTooling.js';
import env from '../env.json' assert { type: 'json' };

const getGameplayElements = () => ({
  framePresenter: document.querySelector('#frame-presenter'),
  inputLabel: document.querySelector('#input-container > label'),
  inputArea: document.querySelector('#input-container > input[type="text"]'),
  sendButton: document.querySelector('#input-container > input[type="button"]'),
  inputPanel: document.querySelector('#input-container'),
});

const getSettingsElements = () => ({
  toggleSettings: document.querySelector('#toggle-settings'),
  settingsContainer: document.querySelector('#settings-container'),
  gameFontColor: document.querySelector('#settings-container > input[name="game-font-color"]'),
  gameBackgroundColor: document.querySelector('#settings-container > input[name="game-background-color"]'),
  resetSettings: document.querySelector('#reset-settings'),
});

const bindFullscreenEvent = gameInterface => {
  window.onkeydown = e => {
    if (!document.fullscreenEnabled) return;
    const tildeCode = 70;
    const hotkeyPressed = e.keyCode === tildeCode && e.ctrlKey && e.altKey;
    if (hotkeyPressed && !document.fullscreenElement)
      gameInterface.requestFullscreen();
  };
};

const loadGameplayStrategy = async ({ host, port, strategy, connection, elements }) => {
  const { runApp } = await import(`../strategies/${strategy}/clients/browser/${connection}.js`);
  const clientResources = {
    elements,
    socket: undefined,
    fetcher: undefined,
  };
  if (connection === connections.ws) {
    clientResources.socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
    clientResources.socket.onclose = () => alert('Game sesion has been ended.');
  } else {
    const { makeFetcher } = await import('../strategies/dataraw/clients/tools.js');
    clientResources.fetcher = makeFetcher({ host, port });
  }
  await runApp(clientResources);
};

window.onload = () => {
  const gameInterface = document.querySelector('#game-interface');
  const elements = getGameplayElements();
  const settings = getSettingsElements();
  const visualSettings = new VisualSettings(settings, elements);
  visualSettings.setInitialBehaviour();

  const { host, port, components: { strategy, connection } } = env;
  const options = { host, port, strategy, connection, elements };

  elements.inputArea.oninput = e => {
    const input = e.target.value;
    if (input.length > 1) elements.inputArea.value = input.at(-1);
  };

  bindFullscreenEvent(gameInterface);
  loadGameplayStrategy(options).catch(e => {
    console.error(e);
    alert('Failed loading a gamemode.');
  });
};
