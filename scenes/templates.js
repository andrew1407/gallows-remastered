import { setTimeout } from 'timers/promises';
import { scenePlayer } from '../io/output.js';
import * as difficultyScene from './difficulty.js';
import * as gameplayScene from './gameplay.js';
import { difficultyLevel } from '../difficulty.js';
import { frameDecorator, labels } from './tools.js';
import { inputMessages } from '../extra.js';

const makePlayableScene = ({ output, loader, current, next = null }) => ({
  loaded: null,
  interractive: false,
  playing: false,

  async setup() {
    if (!this.loaded) this.loaded = await loader();
    if (this.playing) return;
    this.playing = true;
    await scenePlayer(this.loaded, output, setTimeout);
    this.playing = false;
  },
  next() {
    return this.playing ? current : next;
  }
});

const makeDifficultyScene = (playerData, output) => ({
  loaded: null,
  interractive: true,
  input: '',
  inputMessage: inputMessages[labels.difficulty] + ' ',

  async setup() {
    if (!this.loaded) this.loaded = await difficultyScene.loadFrames();
    await scenePlayer(this.loaded, output, setTimeout);
  },
  async next() {
    const created = await difficultyScene.handleInput(this.input);
    if (!created) return labels.difficulty;
    playerData.fill(created);
    const noChallangeMod = difficultyLevel[playerData.difficulty] === difficultyLevel.NO_CHALLANGE;
    return noChallangeMod ? labels.prologue : labels.gameplay;
  },
  passInput(data) {
    this.input = data;
  },
});

const makeGameplayScene = (playerData, output) => ({
  loaded: null,
  interractive: true,
  input: '',
  inputMessage: inputMessages[labels.gameplay] + ' ',

  get won () {
    return playerData.guessed.every(l => !!l);
  },

  async setup() {
    if (!this.loaded) {
      const { difficulty, tries } = playerData;
      const loader = gameplayScene.frameLoaders[difficulty];
      this.loaded = await loader(tries);
    }
    if (this.won) this.loaded = this.loaded.map(f => ({ ...f, after: 1500 }));
    const wrapped = frameDecorator(this.loaded, playerData);
    await scenePlayer(wrapped, output, setTimeout);
  },
  async next() {
    const changed = gameplayScene.handleInput(this.input, playerData);
    playerData.fill(changed);
    if ('tries' in changed) this.loaded = null;
    if (!playerData.tries) return labels.loss;
    if (this.won) {
      await this.setup();
      return labels.win;
    };
    return labels.gameplay;
  },
  passInput(data) {
    this.input = data;
  },
});

export const models = {
  makePlayableScene,
  makeDifficultyScene,
  makeGameplayScene,
};
