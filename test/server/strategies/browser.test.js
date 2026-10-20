import { describe, it, before, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../../../server/setup.js';
import { makeLocalFetcher } from '../../../server/strategies/dataraw/services/local.js';
import { inputPanelSwitch, makeInputResolver, sendInput } from '../../../server/strategies/dataraw/clients/browserUtils.js';
import { runApp as runDatarawHttp } from '../../../server/strategies/dataraw/clients/browser/http.js';
import { runApp as runDatarawWs } from '../../../server/strategies/dataraw/clients/browser/ws.js';
import { runApp as runStreamableWs } from '../../../server/strategies/streamable/clients/browser/ws.js';
import { installDocument, makeAsciiElements, makeElement, submitAnswers, waitQuiet } from '../../stubs/dom.js';
import { FIRST_WORD_LETTERS, pickFirstWord } from '../../stubs/words.js';
import { resetTimers, settle, useMockTimers } from '../../stubs/timers.js';
import { startServer } from '../../stubs/servers.js';

const WON_WORD = '| М | а | я | к | о | в | с | к | и | й |';

const openSocket = url => new Promise((resolve, reject) => {
  const socket = new WebSocket(url);
  socket.onopen = () => resolve(socket);
  socket.onerror = reject;
});

const closed = socket => settle((async () => {
  while (socket.readyState !== socket.CLOSED) await new Promise(setImmediate);
})());

describe('browser clients', () => {
  let loaded;

  before(async () => {
    loaded = await loadData();
  });
  beforeEach(() => {
    installDocument();
    useMockTimers();
    pickFirstWord();
  });
  afterEach(() => {
    resetTimers();
    mock.restoreAll();
  });

  it('resolves inputs only for a waiting reader and toggles the input panel', async () => {
    const resolver = makeInputResolver();
    resolver.value = 'lost';
    const pending = new Promise(resolve => resolver.value.then(resolve));
    resolver.value = 'kept';
    assert.equal(await pending, 'kept');

    const elements = makeAsciiElements();
    const panel = inputPanelSwitch(elements);
    panel.hide();
    panel.hide();
    assert.equal(elements.inputPanel.style.display, 'none');
    panel.show();
    panel.show();
    assert.equal(elements.inputPanel.style.display, 'block');
    assert.equal(document.activeElement, elements.inputArea);

    document.activeElement = null;
    sendInput(elements.inputArea, resolver);
    assert.equal(document.activeElement, elements.inputArea);
  });

  it('dataraw http: plays a local game through the page', async () => {
    const elements = makeAsciiElements();
    const running = runDatarawHttp({ fetcher: makeLocalFetcher(loaded), elements });
    elements.inputArea.onkeypress({ key: 'a' });
    await submitAnswers(elements, ['bad', '2', 'z', ...FIRST_WORD_LETTERS.slice(0, -1)]);
    await waitQuiet(() => elements.framePresenter.textContent);
    elements.inputArea.value = FIRST_WORD_LETTERS.at(-1);
    elements.inputArea.onkeypress({ key: 'Enter' });
    await settle(running);
    assert.ok(elements.framePresenter.textContent.length > 0);
    assert.equal(elements.inputLabel.textContent, '\nLetter: ');
  });

  it('dataraw ws: plays until the server closes the session', async () => {
    const { server, env } = await startServer({ strategy: 'dataraw', connection: 'ws' });
    try {
      const socket = await openSocket(`ws://127.0.0.1:${env.port}/dataraw`);
      const elements = makeAsciiElements();
      const running = runDatarawWs({ socket, elements });
      await submitAnswers(elements, ['1', 'z']);
      await waitQuiet(() => elements.framePresenter.textContent);
      elements.inputArea.value = 'z';
      elements.inputArea.onkeypress({ key: 'Enter' });
      elements.inputArea.onkeypress({ key: 'a' });
      await settle(running);
      assert.equal(socket.readyState, socket.CLOSED);
    } finally {
      await server.shutdown();
    }
  });

  it('streamable ws: renders streamed frames and toggles input', async () => {
    const { server, env } = await startServer({ strategy: 'streamable', connection: 'ws' });
    try {
      const socket = await openSocket(`ws://127.0.0.1:${env.port}/streamable`);
      const elements = makeAsciiElements();
      const history = [];
      Object.defineProperty(elements.framePresenter, 'innerHTML', {
        get: () => history.at(-1) ?? '',
        set: frame => void history.push(frame),
      });
      const presented = () => elements.framePresenter.innerHTML;
      runStreamableWs({ socket, elements });
      socket.onmessage({ data: JSON.stringify({}) });
      elements.inputArea.onkeypress({ key: 'a' });
      elements.sendButton.onclick();
      await submitAnswers(elements, ['2', ...FIRST_WORD_LETTERS], { read: presented });
      elements.inputArea.value = 'x';
      elements.inputArea.onkeypress({ key: 'Enter' });
      await closed(socket);
      assert.ok(history.some(frame => frame.includes(WON_WORD)));
      assert.equal(elements.inputArea.disabled, true);
    } finally {
      await server.shutdown();
    }
  });

  it('streamable ws: keeps an already focused input', () => {
    const elements = makeAsciiElements();
    elements.inputArea.focus();
    const socket = { send(data) { this.sent = data; } };
    runStreamableWs({ socket, elements });
    elements.inputArea.disabled = true;
    socket.onmessage({ data: JSON.stringify({ frame: 'f', scene: 'gameplay' }) });
    assert.equal(elements.inputLabel.textContent, 'Letter:');
    elements.inputArea.value = 'q';
    elements.sendButton.onclick();
    assert.equal(socket.sent, 'q');
    assert.equal(makeElement().hidden, false);
  });
});
