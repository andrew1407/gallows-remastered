import { makeFetcher } from '../dataraw/clients/browserUtils.js';
import { connections } from '../strategies.js';

(async () => {
  const framePresenter = document.querySelector('#frame-presenter');
  const inputLabel = document.querySelector('#input-container > label');
  const inputArea = document.querySelector('#input-container > input[type=text]');
  const sendButton = document.querySelector('#input-container > input[type=button]');
  const inputPanel = document.querySelector('#input-container');
  const elements = { framePresenter, inputLabel, inputArea, sendButton, inputPanel };
  const { host, port, components } = await fetch('/params.json').then(res => res.json())
  const { strategy, connection } = components;
  const { runApp } = await import(`../${strategy}/clients/browser/${connection}.js`);
  const clientResources = {
    elements,
    socket: undefined,
    fetcher: undefined,
  };
  console.log(components);
  if (connection === connections.ws)
    clientResources.socket = new WebSocket(`ws://${host}:${port}/${strategy}`);
  else
    clientResources.fetcher = makeFetcher({ host, port });
  await runApp?.(clientResources);
})();
