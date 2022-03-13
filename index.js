import InputReader from './io/input.js';
import * as winScene from './scenes/win.js';
import * as lossScene from './scenes/loss.js';
import * as prologueScene from './scenes/prologue.js';
import { models } from './scenes/templates.js';
import { labels } from './scenes/tools.js';
import { consoleOutput, playerDataContainer } from './extra.js';

const scenesIterator = (iterable, initial) => ({
  iterable,
  currentScene: null,

  filterSceneObj: scene => ({
    interractive: scene.interractive ?? false,
    passInput: (...args) => scene.passInput(...args),
    inputMessage: scene.inputMessage,
  }),

  async next() {
    const label = this.currentScene ? await this.currentScene.next() : initial;
    const done = !label;
    if (done) return { done };
    const scene = this.iterable[label];
    this.currentScene = scene;
    await scene.setup();
    const value = this.filterSceneObj(scene);
    return { done, value };
  },
  
  [Symbol.asyncIterator]() {
    const next = () => this.next();
    return { next };
  },
});

const playerData = playerDataContainer();
const iterable = {
  [labels.difficulty]: models.makeDifficultyScene(playerData, consoleOutput),
  [labels.prologue]: models.makePlayableScene({
    loader: prologueScene.loadFrames,
    current: labels.prologue,
    next: labels.gameplay,
    output: consoleOutput,
  }),
  [labels.gameplay]: models.makeGameplayScene(playerData, consoleOutput),
  [labels.win]: models.makePlayableScene({
    loader: winScene.loadFrames,
    current: labels.win,
    output: consoleOutput,
  }),
  [labels.loss]: models.makePlayableScene({
    loader: () => lossScene.frameLoaders[playerData.difficulty](),
    current: labels.loss,
    output: consoleOutput,
  }),
};

const scenes = scenesIterator(iterable, labels.difficulty);
const input = new InputReader();
input.open();
for await (const scene of scenes) {
  if (!scene.interractive) continue;
  const inputData = await input.read(scene.inputMessage);
  scene.passInput(inputData);
}
input.close();
