import * as winScene from './scenes/win.js';
import * as lossScene from './scenes/loss.js';
import * as prologueScene from './scenes/prologue.js';
import { models } from './scenes/templates.js';
import { labels } from './scenes/tools.js';
import { consoleOutput, playerDataContainer } from './extra.js';

export const scenesIterator = (iterable, initial) => ({
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
    return { next: () => this.next() };
  },
});

export const iteravbleStages = (playerData, output) => ({
  [labels.difficulty]: models.makeDifficultyScene(playerData, output),
  [labels.prologue]: models.makePlayableScene({
    loader: prologueScene.loadFrames,
    current: labels.prologue,
    next: labels.gameplay,
    output,
  }),
  [labels.gameplay]: models.makeGameplayScene(playerData, output),
  [labels.win]: models.makePlayableScene({
    loader: winScene.loadFrames,
    current: labels.win,
    output,
  }),
  [labels.loss]: models.makePlayableScene({
    loader: () => lossScene.frameLoaders[playerData.difficulty](),
    current: labels.loss,
    output,
  }),
});

export const runConsoleApp = async ({ input, output = consoleOutput }) => {
  const playerData = playerDataContainer();
  const iterable = iteravbleStages(playerData, output);
  const scenes = scenesIterator(iterable, labels.difficulty);
  input.open();
  for await (const scene of scenes) {
    if (!scene.interractive) continue;
    const inputData = await input.read(scene.inputMessage);
    scene.passInput(inputData);
  }
  input.close();
};
