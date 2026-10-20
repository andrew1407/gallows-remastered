import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { triesCount } from '../../../../../difficulty.js';
import { labels } from '../../../../../scenes/tools.js';
import { animationStates } from '../../../../../server/public/sprites/components/mainCharacter.js';
import DifficultyViewController from '../../../../../server/public/sprites/views/difficulty.js';
import GameplayViewController from '../../../../../server/public/sprites/views/gameplay.js';
import LossViewController from '../../../../../server/public/sprites/views/loss.js';
import PrologueViewController from '../../../../../server/public/sprites/views/prologue.js';
import WinViewController from '../../../../../server/public/sprites/views/win.js';
import ViewsContainer from '../../../../../server/public/sprites/views/viewsContainer.js';
import { makeScene, play } from '../../../../stubs/sprites.js';

const guessed = ['a', null];
const progress = (difficulty, tries, extra = {}) => ({ stage: labels.gameplay, difficulty, tries, guessed, ...extra });
const visibleParts = world => world.mainCharacter.nodes.slice(1).filter(n => n.visible).map(n => n.sprite);

describe('view controllers', () => {
  it('shows the difficulty description once per game', async () => {
    const scene = makeScene();
    const view = new DifficultyViewController(scene.viewTools, 'text');
    await play(scene, view.playActions());
    scene.tabs.message = '';
    await play(scene, view.playActions());
    assert.equal(scene.tabs.message, '');
    view.resetState();
    await play(scene, view.playActions());
    assert.equal(scene.tabs.message, 'text');
  });

  it('plays the prologue dialogue and walks away', async () => {
    const scene = makeScene();
    const states = new Set();
    let dialogue = false;
    await play(scene, new PrologueViewController(scene.viewTools).playActions(), {
      onTick: ({ world, tabs }) => {
        states.add(world.mainCharacter.currentState);
        dialogue ||= tabs.characterDialogueVisible;
      },
    });
    assert.ok(dialogue && states.has(animationStates.TALKING));
    assert.equal(scene.tabs.characterDialogueVisible, false);
    assert.equal(scene.world.mainCharacter.transform.x, -12);
  });

  it('builds the gallows on normal misses and jumps on the last try', async () => {
    const scene = makeScene();
    const view = new GameplayViewController(scene.viewTools);
    await play(scene, view.playActions(progress('NORMAL', 7)));
    assert.equal(scene.world.mainCharacter.transform.x, 0);
    assert.deepEqual([scene.tabs.word, scene.tabs.tries, scene.tabs.guessingVisible], [guessed, 7, true]);

    await play(scene, view.playActions(progress('NORMAL', 7, { guessed: ['a', 'b'] })));
    assert.deepEqual(scene.tabs.word, ['a', 'b']);

    const { parts } = scene.world.hanger;
    for (let tries = 6; tries > 1; --tries) {
      await play(scene, view.playActions(progress('NORMAL', tries)));
      assert.equal(scene.world.hanger.nodes[6 - tries].y, parts[6 - tries] === parts[4] ? -1.57 : 0);
    }
    await play(scene, view.playActions(progress('NORMAL', 1)));
    assert.equal(scene.world.mainCharacter.transform.y, 0);
    view.resetState();
  });

  it('reveals the body part by part on easy misses', async () => {
    const scene = makeScene();
    const view = new GameplayViewController(scene.viewTools);
    await play(scene, view.playActions(progress('EASY', triesCount.EASY)));
    assert.equal(scene.world.mainCharacter.bodyVisible, false);
    assert.equal(scene.world.mainCharacter.transform.x, 0);
    await play(scene, view.playActions(progress('EASY', 12)));
    assert.deepEqual(visibleParts(scene.world), ['leftLeg']);
    for (const tries of [11, 10, 9, 8]) await play(scene, view.playActions(progress('EASY', tries)));
    assert.equal(visibleParts(scene.world).length, 5);
    await play(scene, view.playActions(progress('EASY', 7)));
    assert.equal(scene.world.mainCharacter.bodyVisible, true);
    await play(scene, view.playActions(progress('EASY', 6)));
    assert.equal(scene.world.hanger.parts[0].moving, false);
  });

  it('only updates tries on difficult and no challange misses', async () => {
    for (const [difficulty, tries, shown] of [['DIFFICULT', 1, 1], ['NO_CHALLANGE', triesCount.NO_CHALLANGE, 10]]) {
      const scene = makeScene();
      const view = new GameplayViewController(scene.viewTools);
      await play(scene, view.playActions(progress(difficulty, tries)));
      assert.equal(scene.tabs.tries, shown);
      await play(scene, view.playActions(progress(difficulty, tries - 1)));
      assert.equal(scene.tabs.tries, shown - 1);
    }
  });

  it('hangs, runs over or lectures the player on loss', async () => {
    for (const difficulty of ['NORMAL', 'EASY']) {
      const hanged = makeScene();
      await play(hanged, new LossViewController(hanged.viewTools, 'lecture').playActions(progress(difficulty, 0)));
      assert.equal(hanged.world.mainCharacter.currentState, animationStates.HANGED);
      assert.equal(hanged.world.mainCharacter.transform.y, 1.2);
    }

    const caught = makeScene();
    Object.assign(caught.world.mainCharacter.transform, caught.viewTools.movement.center);
    let shouted = false;
    await play(caught, new LossViewController(caught.viewTools, 'lecture').playActions(progress('DIFFICULT', 0)), {
      onTick: ({ tabs }) => void(shouted ||= tabs.runnerDialogueVisible),
    });
    assert.ok(shouted);
    assert.equal(caught.world.mainCharacter.bodyVisible, false);

    const lectured = makeScene();
    await play(lectured, new LossViewController(lectured.viewTools, 'lecture').playActions(progress('NO_CHALLANGE', 0)));
    assert.deepEqual([lectured.tabs.message, lectured.tabs.tries], ['lecture', 0]);
  });

  it('celebrates wins per difficulty', async () => {
    const lazy = makeScene();
    await play(lazy, new WinViewController(lazy.viewTools).playActions(progress('NO_CHALLANGE', 5)));
    assert.equal(lazy.world.mainCharacter.transform.x, 0);
    assert.equal(lazy.world.mainCharacter.currentState, animationStates.WIN_REACTION);

    const easy = makeScene();
    easy.world.mainCharacter.bodyVisible = false;
    await play(easy, new WinViewController(easy.viewTools).playActions(progress('EASY', 9)));
    assert.equal(easy.world.mainCharacter.bodyVisible, true);
  });

  it('dispatches views by stage label and resets them', async () => {
    const scene = makeScene();
    const views = new ViewsContainer(scene.viewTools, { difficultyText: 'difficulty', lossMessage: 'loss' });
    assert.ok(views.get(labels.gameplay) instanceof GameplayViewController);
    for (const stage of Object.values(labels)) assert.ok(views.get(stage), stage);
    await play(scene, views.get(labels.difficulty).playActions());
    views.resetState();
    scene.tabs.message = '';
    await play(scene, views.get(labels.difficulty).playActions());
    assert.equal(scene.tabs.message, 'difficulty');
  });
});
