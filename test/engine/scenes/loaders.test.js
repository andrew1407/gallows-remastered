import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { triesCount } from '../../../difficulty.js';
import * as difficultyScene from '../../../scenes/difficulty.js';
import * as gameplayScene from '../../../scenes/gameplay.js';
import * as lossScene from '../../../scenes/loss.js';
import * as prologueScene from '../../../scenes/prologue.js';
import * as winScene from '../../../scenes/win.js';
import { FIRST_WORD, pickFirstWord } from '../../stubs/words.js';

describe('scene loaders', () => {
  afterEach(() => mock.restoreAll());

  it('fills difficulty tries into the selector', async () => {
    const filled = difficultyScene.fillDiffiultyScene('DIFFICULT NORMAL EASY NO_CHALLANGE');
    assert.equal(filled, `1 7 13 overmnogo`);
    const [{ frames: [frame] }] = await difficultyScene.loadFrames();
    assert.match(frame, /\(7 tries\)/);
  });

  it('validates difficulty input against the words list', async () => {
    pickFirstWord();
    assert.equal(await difficultyScene.handleInput('x'), null);
    const created = await difficultyScene.handleInput('3++');
    assert.equal(created.left.join(''), FIRST_WORD);
    assert.equal(created.tries, triesCount.EASY);
    assert.equal(difficultyScene.makePlayerDataValidator(['a'])('1').difficulty, 'DIFFICULT');
  });

  it('loads gameplay frames per difficulty', async () => {
    for (const label in gameplayScene.frameLoaders) {
      const [{ frames }] = await gameplayScene.frameLoaders[label](5);
      assert.equal(frames.length, 1, label);
    }
    assert.deepEqual(gameplayScene.handleInput('z', { left: ['a'], guessed: [null], tries: 1 }), { tries: 0 });
  });

  it('loads loss, prologue and win scenes', async () => {
    for (const label in lossScene.frameLoaders)
      assert.ok((await lossScene.frameLoaders[label]()).length, label);
    assert.equal((await prologueScene.loadFrames()).length, 2);
    assert.equal((await winScene.loadFrames())[0].repeat, 100);
  });
});
