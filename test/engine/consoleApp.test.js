import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { makeInputStub } from '../stubs/input.js';
import { FIRST_WORD_LETTERS, pickFirstWord } from '../stubs/words.js';
import { mockPromiseTimers, resetTimers, settle, useMockTimers } from '../stubs/timers.js';

mockPromiseTimers();
const { runConsoleApp } = await import('../../consoleApp.js');

const play = async answers => {
  const frames = [];
  const input = makeInputStub(answers);
  await settle(runConsoleApp({ input, output: f => frames.push(f) }));
  return { input, frames };
};

describe('console app', () => {
  beforeEach(() => {
    useMockTimers();
    pickFirstWord();
  });
  afterEach(() => {
    resetTimers();
    mock.restoreAll();
  });

  it('plays a winning game after an invalid difficulty', async () => {
    const { input, frames } = await play(['wrong', '2', 'z', ...FIRST_WORD_LETTERS]);
    assert.ok(input.opened && input.closed);
    assert.match(input.messages[0], /Number/);
    assert.ok(frames.some(f => f.startsWith('| М | а | я |')));
  });

  it('plays the prologue and loses the difficult game', async () => {
    const prologue = await play(['4', ...FIRST_WORD_LETTERS]);
    assert.ok(prologue.frames.length > 20);
    const { frames } = await play(['1', 'z']);
    assert.ok(frames.length > 10);
  });

  it('uses the console output by default', async () => {
    const log = mock.method(console, 'log', () => {});
    mock.method(console, 'clear', () => {});
    await settle(runConsoleApp({ input: makeInputStub(['1', 'z']) }));
    assert.ok(log.mock.callCount() > 0);
  });
});
