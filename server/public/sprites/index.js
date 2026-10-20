import World, { VIEW, characterMovement } from './components/world.js';
import { spriteUrl, sprites } from './components/catalog.js';
import GameLoop from './gameLoop/gameLoop.js';
import GameModeSelector from './gameLoop/gameModeSelector.js';
import StageActivity from './gameLoop/stageActivity.js';
import ViewsContainer from './views/viewsContainer.js';
import { buildAtlas } from './render/atlas.js';
import { makeInstanceBuffer } from './render/instances.js';
import { makeRenderer } from './render/rendererFactory.js';
import { getElements, makeInputField, makeStartOptions, makeTabs } from './ui/elements.js';
import { fitStage } from './ui/stage.js';
import texts from './texts.js';
import { makeStrategyFactory } from '../../strategies/dataraw/clients/sprites/strategyFactory.js';
import { loadResources } from '../resources.js';

const MAX_DELTA_TIME = 1 / 3;

const loadImage = async file => {
  const image = new Image();
  image.src = spriteUrl(file);
  await image.decode();
  return image;
};

const loadSprites = async () => {
  const loaders = Object.entries(sprites).map(async ([key, { file }]) => [key, file && await loadImage(file)]);
  return Object.fromEntries(await Promise.all(loaders));
};

const makeCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });

const formatDifficultyText = loaded => loaded.difficulty[0].frames[0].replace(/^.*$/m, texts.difficultyHeader);

const exitPage = () => {
  window.close();
  location.replace('about:blank');
};

const bindControls = (elements, gameLoop, input) => {
  const { letterInput, submit, restart, info, exit } = elements;
  letterInput.oninput = () => void(input.text = gameLoop.formatInput(input.text));
  letterInput.onkeydown = e => e.key === 'Enter' ? gameLoop.playStage() : undefined;
  submit.onclick = () => gameLoop.playStage();
  restart.onclick = () => gameLoop.resetState();
  info.onclick = () => window.open(texts.infoUrl, '_blank', 'noopener');
  exit.onclick = () => {
    if (!confirm(texts.exitQuestion)) return;
    gameLoop.dispose();
    exitPage();
  };
};

const runFrames = ({ world, activity, renderer }) => {
  const instances = makeInstanceBuffer();
  let last = performance.now();
  const frame = now => {
    const dt = Math.min(Math.max(now - last, 0) / 1000, MAX_DELTA_TIME);
    last = now;
    world.update(dt);
    activity.tick(dt);
    renderer.draw(instances, world.writeInstances(instances));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

export const launch = async () => {
  const elements = getElements();
  const [loaded, images] = await Promise.all([loadResources(), loadSprites()]);
  const atlas = buildAtlas(images, makeCanvas);
  const renderer = await makeRenderer(elements.canvas, atlas, VIEW);
  if (!renderer) return alert(texts.rendererMissing);
  console.info(`gallows sprites renderer: ${renderer.label}`);

  const world = new World(atlas.regions);
  const tabs = makeTabs(elements, texts);
  const activity = new StageActivity();
  const input = makeInputField(elements.letterInput);
  const views = new ViewsContainer({ world, tabs, movement: characterMovement }, {
    difficultyText: formatDifficultyText(loaded),
    lossMessage: texts.lossMessage,
  });
  const gameLoop = new GameLoop({ tabs, input, activity, views, world });
  const selector = new GameModeSelector({
    options: makeStartOptions(elements),
    gameLoop,
    strategyFactory: makeStrategyFactory(loaded),
    onFailure: e => {
      console.error(e);
      alert(texts.connectionFailed);
    },
  });

  gameLoop.initialize();
  selector.initialize();
  bindControls(elements, gameLoop, input);
  const fit = () => fitStage(elements, renderer);
  fit();
  addEventListener('resize', fit);
  addEventListener('pagehide', () => gameLoop.dispose());
  runFrames({ world, activity, renderer });
};
