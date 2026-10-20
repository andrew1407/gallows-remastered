import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import texts from '../../../../server/public/sprites/texts.js';

describe('sprites texts', () => {
  it('keeps the strings frozen', () => {
    assert.ok(Object.isFrozen(texts));
    assert.match(texts.difficultyHeader, /^Difficulty \(add '\+\+'/);
    assert.match(texts.runnerDialogue, /^ЕГО+Р!!!$/);
    assert.equal(texts.lossMessage.split('\n').length, 5);
    assert.ok(texts.characterDialogue.includes('\n        на виселице умру.'));
    assert.match(texts.infoUrl, /^https:\/\/github\.com\//);
  });
});
