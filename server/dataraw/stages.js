import { difficultyLevel } from '../../difficulty.js';
import { handleInput } from '../../scenes/gameplay.js';
import { labels} from '../../scenes/tools.js';

export default {
  [labels.difficulty]: async ({ input, resources }) => {
    const playerData = resources.createPlayerData(input);
    if (!playerData) return { stage: labels.difficulty };
    const easyMode = difficultyLevel[playerData.difficulty] === difficultyLevel.NO_CHALLANGE;
    const stage = easyMode ? labels.prologue : labels.gameplay;
    return { ...playerData, stage };
  },
  [labels.prologue]: () => ({ stage: labels.gameplay }),
  [labels.gameplay]: async ({ playerData, input }) => {
    const handled = handleInput(input, playerData);
    const failed = 'tries' in handled;
    const loss = failed && !handled.tries;
    if (loss) return { ...handled, stage: labels.loss };
    const won = !failed && handled.guessed?.every(l => !!l);
    if (won) return { ...handled, stage: labels.win };
    return handled;
  },
  [labels.loss]: () => null,
  [labels.win]: () => null,
};
