import { setTimeout } from 'node:timers/promises';
import { defineStageHandlers, difficultyLevel } from '../../../difficulty.js';
import { scenePlayer } from '../../../io/output.js';
import { handleInput } from '../../../scenes/gameplay.js';
import { labels } from '../../../scenes/tools.js';
import { frameDecorator } from '../../../scenes/tools.js';

const streamOutput = (socket, scene) => frame => new Promise((res, rej) => {
  if (socket.readyState === socket.CLOSED) return res();
  const data = JSON.stringify({ frame, scene });
  socket.send(data, err => err ? rej(err) : res());
});

const streamFrames = (socket, frames, scene) => (
  scenePlayer(frames, streamOutput(socket, scene), setTimeout)
);

const stages = {
  [labels.difficulty]: {
    previous: async ({ socket, resources }) => {
      await streamFrames(socket, resources.difficulty, labels.difficulty);
      const playerData = {
        stage: labels.difficulty,
        playing: false,
      };
      return { data: playerData };
    },
    default: async ({ resources, input }) => {
      const playerData = resources.createPlayerData(input);
      if (!playerData) return null;
      const easyMode = difficultyLevel[playerData.difficulty] === difficultyLevel.NO_CHALLANGE;
      const next = { label: easyMode ? labels.prologue : labels.gameplay };
      if (!easyMode) next.action = 'previous';
      return { data: playerData, next };
    },
  },
  [labels.prologue]: async ({ socket, resources }) => {
    await streamFrames(socket, resources.prologue, labels.prologue);
    const next = { label: labels.gameplay, action: 'previous' }
    return { next };
  },
  [labels.gameplay]: {
    previous: async ({ socket, resources, data }) => {
      const { tries, guessed, difficulty } = data;
      const stage = defineStageHandlers[difficulty](tries);
      const scene = frameDecorator(resources.stages[stage], { tries, guessed, difficulty });
      await streamFrames(socket, scene, labels.gameplay);
      return null;
    },
    default: async ({ socket, resources, data, input }) => {
      const handled = handleInput(input, data);
      const failed = 'tries' in handled;
      const lost = failed && !handled.tries;
      const won = !failed && handled.guessed?.every(l => !!l);
      if (lost || won) return {
        next: { label: lost ? labels.loss : labels.win },
        data: handled,
      };
      const { difficulty } = data;
      const guessed = handled.guessed ?? data.guessed;
      const tries = handled.tries ?? data.tries;
      const stage = defineStageHandlers[difficulty](tries);
      const decor = { difficulty, tries, guessed };
      const scene = frameDecorator(resources.stages[stage], decor);
      await streamFrames(socket, scene, labels.gameplay);
      return { data: handled };
    },
  },
  [labels.win]: async ({ socket, resources, data }) => {
    const { tries, difficulty, guessed } = data;
    const stageNumber = defineStageHandlers[difficulty](tries);
    const finalGameplayStage = resources.stages[stageNumber].map(f => ({ ...f, after: 1500 }));
    const decor = { difficulty, tries, guessed };
    const finalStage = frameDecorator(finalGameplayStage, decor);
    const scenes = finalStage.concat(resources.win);
    await streamFrames(socket, scenes, labels.win);
    socket.close();
    return null;
  },
  [labels.loss]: async ({ socket, resources, data }) => {
    await streamFrames(socket, resources.loss[data.difficulty], labels.loss);
    socket.close();
    return null;
  },
};

export const initialStages = Object.freeze({
  [Symbol.for('start')]: { label: labels.difficulty, action: 'previous' },
  [labels.difficulty]: { label: labels.difficulty, action: 'default' },
  [labels.gameplay]: { label: labels.gameplay, action: 'default' },
});

export const execStage = ({ label, action }, params) => {
  if (!(label in stages)) return;
  const stage = stages[label];
  return typeof stage === 'function' ? stage(params) : stage[action](params);
};
