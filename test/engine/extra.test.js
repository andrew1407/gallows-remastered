import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { consoleOutput, inputMessages, playerDataContainer } from '../../extra.js';
import { labels } from '../../scenes/tools.js';

describe('extra', () => {
  it('fills the player data container', () => {
    const playerData = playerDataContainer();
    playerData.fill({ stage: labels.win, tries: 2 });
    assert.equal(playerData.stage, labels.win);
    assert.equal(playerData.tries, 2);
  });

  it('clears the console before printing a frame', () => {
    const clear = mock.method(console, 'clear', () => {});
    const log = mock.method(console, 'log', () => {});
    consoleOutput('frame');
    assert.equal(clear.mock.callCount(), 1);
    assert.deepEqual(log.mock.calls[0].arguments, ['frame']);
    mock.restoreAll();
  });

  it('has input messages for interractive stages', () => {
    assert.match(inputMessages[labels.difficulty], /Number/);
    assert.equal(inputMessages[labels.gameplay], 'Letter:');
  });
});
