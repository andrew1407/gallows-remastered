import { connections } from '../strategies.js';

(async () => {
  const gameInterface = document.querySelector('#game-interface');
  const framePresenter = document.querySelector('#frame-presenter');
  const inputLabel = document.querySelector('#input-container > label');
  const inputArea = document.querySelector('#input-container > input[type=text]');
  const sendButton = document.querySelector('#input-container > input[type=button]');
  const inputPanel = document.querySelector('#input-container');

  window.onkeydown = e => {
    if (!document.fullscreenEnabled) return;
    const tildeCode = 70;
    const hotkeyPressed = e.keyCode === tildeCode && e.ctrlKey && e.altKey;
    if (hotkeyPressed && !document.fullscreenElement)
      gameInterface.requestFullscreen();
  };

  const elements = { framePresenter, inputLabel, inputArea, sendButton, inputPanel };
  const { host, port, components } = await fetch('/params.json').then(res => res.json())
  const { strategy, connection } = components;
  const { runApp } = await import(`../${strategy}/clients/browser/${connection}.js`);
  const clientResources = {
    elements,
    socket: undefined,
    fetcher: undefined,
  };
  if (connection === connections.ws) {
    clientResources.socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
  } else {
    const { makeFetcher } = await import('../dataraw/clients/browserUtils.js');
    clientResources.fetcher = makeFetcher({ host, port });
  }
  await runApp?.(clientResources);
})();
