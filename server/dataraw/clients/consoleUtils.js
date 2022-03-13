import { request } from 'http';
import { loadFrames as loadDifficulty } from '../../../scenes/difficulty.js';
import { loadFrames as loadPrologue } from '../../../scenes/prologue.js';
import { frameLoaders as loadGameplay } from '../../../scenes/gameplay.js';
import { loadFrames as loadWin } from '../../../scenes/win.js';
import { frameLoaders as loadLoss } from '../../../scenes/loss.js';
import { frameDecorator, labels } from '../../../scenes/tools.js';

export const makeFetcher = ({ host, port }) => async (route, data) => new Promise((res, rej) => {
  const bodyStringified = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json',
    'Constent-Length': Buffer.byteLength(bodyStringified),
  };
  const options = { host, port, headers, method: 'POST', path: route };
  const req = request(options, async clientRes => {
    const chunks = [];
    for await (const chunk of clientRes) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    try {
      const parsed = JSON.parse(body);
      res(parsed);
    } catch {
      res({});
    }
  });
  req.on('error', rej).end(bodyStringified);
});

export const makeFileLoader = playerData => {
  const difficultyLoader = {
    loaded: null,
    async load() {
      if (!this.loaded) this.loaded = await loadDifficulty();
      return this.loaded;
    }
  };
  const resources = {
    [labels.difficulty]: () => difficultyLoader.load(),
    [labels.prologue]: loadPrologue,
    [labels.gameplay]: () => loadGameplay[playerData.difficulty](playerData.tries),
    [labels.win]: loadWin,
    [labels.loss]: () => loadLoss[playerData.difficulty](),
  };
  return () => resources[playerData.stage]?.();
};

export const runScenes = async ({ socket, scenes, input, playFrames }) => {
  for await (const scene of scenes) {
    if (socket && socket.readyState === socket.CLOSED) break;
    if (scenes.playing) continue;
    const { frames, inputMessage, playerData } = scene;
    if (scenes.interractive(scene)) {
      const outputFrames = playerData.stage === labels.gameplay ?
        frameDecorator(frames, playerData) : frames;
      await playFrames(outputFrames);
      const data = await input.read(inputMessage);
      scene.passInput(data);
    } else {
      scenes.playing = true;
      await playFrames(frames);
      scenes.playing = false;
    }
  }
};
