import VisualSettings from './visualSettings.js';
import { connections } from '../../strategiesTooling.js';
import { makeFetcher } from '../../strategies/dataraw/clients/tools.js';
import { isStandalone, loadResources } from '../resources.js';

const LOCAL_CONNECTION = 'local';

const localEnv = Object.freeze({
  components: { strategy: 'dataraw', connection: LOCAL_CONNECTION },
});

const clientModules = Object.freeze({
  [connections.ws]: connections.ws,
  [connections.http]: connections.http,
  [LOCAL_CONNECTION]: connections.http,
});

const clientResources = {
  [connections.ws]: ({ host, port, strategy }) => {
    const socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
    socket.onclose = () => alert('Game sesion has been ended.');
    return { socket };
  },
  [connections.http]: ({ host, port }) => ({ fetcher: makeFetcher({ host, port }) }),
  [LOCAL_CONNECTION]: async () => {
    const { makeLocalFetcher } = await import('../../strategies/dataraw/services/local.js');
    return { fetcher: makeLocalFetcher(await loadResources()) };
  },
};

const loadEnv = () => {
  if (isStandalone) return Promise.resolve(localEnv);
  return fetch('./env.json').then(res => res.json()).catch(() => localEnv);
};

const getGameplayElements = () => ({
  framePresenter: document.querySelector('#frame-presenter'),
  inputLabel: document.querySelector('#input-container > label'),
  inputArea: document.querySelector('#input-container > input[type="text"]'),
  sendButton: document.querySelector('#input-container > input[type="button"]'),
  inputPanel: document.querySelector('#input-container'),
});

const getSettingsElements = () => ({
  gameSettings: document.querySelector('#game-settings'),
  toggleSettings: document.querySelector('#toggle-settings'),
  settingsContainer: document.querySelector('#settings-container'),
  gameFontColor: document.querySelector('#settings-container > input[name="game-font-color"]'),
  gameBackgroundColor: document.querySelector('#settings-container > input[name="game-background-color"]'),
  resetSettings: document.querySelector('#reset-settings'),
  pickerAnchor: document.querySelector('#color-picker-anchor'),
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
  const clientModule = clientModules[connection] ?? connection;
  const { runApp } = await import(`../../strategies/${strategy}/clients/browser/${clientModule}.js`);
  const resources = await clientResources[connection]?.({ host, port, strategy });
  await runApp({ elements, socket: undefined, fetcher: undefined, ...resources });
};

export const launch = async () => {
  const gameInterface = document.querySelector('#game-interface');
  const elements = getGameplayElements();
  const settings = getSettingsElements();
  const visualSettings = new VisualSettings(settings, elements);
  visualSettings.setInitialBehaviour();

  elements.inputArea.oninput = e => {
    const input = e.target.value;
    if (input.length > 1) elements.inputArea.value = input.at(-1);
  };

  // autofocus is skipped while the version container is still hidden on page load
  elements.inputArea.focus();
  bindFullscreenEvent(gameInterface);
  const { host, port, components: { strategy, connection } } = await loadEnv();
  const options = { host, port, strategy, connection, elements };
  loadGameplayStrategy(options).catch(e => {
    console.error(e);
    alert('Failed loading a gamemode.');
  });
};
