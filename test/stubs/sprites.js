import World, { characterMovement } from '../../server/public/sprites/components/world.js';
import { sprites } from '../../server/public/sprites/components/catalog.js';
import StageActivity from '../../server/public/sprites/gameLoop/stageActivity.js';

export const DT = 1 / 60;

export const makeRegions = (size = 32) => {
  const regions = {};
  for (const key in sprites) regions[key] = { width: size, height: size, u0: 0, v0: 0, u1: 1, v1: 1 };
  return regions;
};

export const makeTabsStub = () => ({
  message: '',
  tries: null,
  word: null,
  messageVisible: false,
  guessingVisible: false,
  characterDialogueVisible: false,
  runnerDialogueVisible: false,
  initialized: 0,
  resets: 0,
  initialize() {
    ++this.initialized;
  },
  resetState() {
    ++this.resets;
    Object.assign(this, { message: '', word: null, guessingVisible: false });
  },
});

export const makeScene = () => {
  const world = new World(makeRegions());
  const tabs = makeTabsStub();
  const activity = new StageActivity();
  const viewTools = { world, tabs, movement: characterMovement };
  return { world, tabs, activity, viewTools };
};

export const tick = ({ world, activity }, dt = DT) => {
  world.update(dt);
  activity.tick(dt);
};

export const play = async (scene, action, { maxTicks = 20_000, onTick } = {}) => {
  let done = false;
  const finished = scene.activity.awaitActionFinish(action).then(result => {
    done = true;
    return result;
  });
  for (let i = 0; i < maxTicks && !done; ++i) {
    tick(scene);
    onTick?.(scene);
    await Promise.resolve();
  }
  return finished;
};
