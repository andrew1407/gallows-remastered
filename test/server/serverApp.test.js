import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_WORD_LETTERS, pickFirstWord } from '../stubs/words.js';
import { resetTimers, useMockTimers } from '../stubs/timers.js';
import { runConsoleClient, startServer } from '../stubs/servers.js';

const winningAnswers = ['bad', '2', 'z', ...FIRST_WORD_LETTERS];
const isWon = frames => frames.some(f => f.includes('| М | а | я | к | о | в | с | к | и | й |'));

const games = {
  'dataraw http': { components: { strategy: 'dataraw', connection: 'http' } },
  'dataraw ws': { components: { strategy: 'dataraw', connection: 'ws' } },
  'dataraw tcp': { components: { strategy: 'dataraw', connection: 'tcp' } },
  'dataraw udp': { components: { strategy: 'dataraw', connection: 'udp' } },
  'streamable ws': { components: { strategy: 'streamable', connection: 'ws' } },
  'streamable tcp': { components: { strategy: 'streamable', connection: 'tcp' } },
};

describe('server app with console clients', () => {
  beforeEach(() => {
    useMockTimers();
    pickFirstWord();
  });
  afterEach(() => {
    resetTimers();
    mock.restoreAll();
  });

  for (const label in games) {
    const { components } = games[label];
    const streamed = components.strategy === 'streamable';
    it(`${label}: plays a winning game`, async () => {
      pickFirstWord();
      const { server, env } = await startServer(components);
      const { frames, input } = await runConsoleClient({ components, env, answers: winningAnswers, streamed });
      assert.ok(input.opened, label);
      assert.ok(isWon(frames), label);
      await server.shutdown();
    });
  }

  it('dataraw http: loses a difficult game', async () => {
    const components = { strategy: 'dataraw', connection: 'http' };
    const { server, env } = await startServer(components);
    const { frames } = await runConsoleClient({ components, env, answers: ['1', 'z'] });
    assert.ok(frames.some(f => f.includes('Tries: 1')));
    await server.shutdown();
  });

  for (const connection of ['tcp', 'udp'])
    it(`streamable ${connection}: streams the difficulty frame`, async () => {
      const components = { strategy: 'streamable', connection };
      const { server, env } = await startServer(components);
      const until = frames => frames.some(f => f.includes('Difficulty:'));
      const { frames, input } = await runConsoleClient({ components, env, answers: [], until });
      assert.ok(until(frames));
      assert.equal(input.closed, true);
      await server.shutdown();
    });

  it('streamable ws: plays the prologue', async () => {
    const components = { strategy: 'streamable', connection: 'ws' };
    const { server, env } = await startServer(components);
    const { frames } = await runConsoleClient({ components, env, answers: ['4', ...FIRST_WORD_LETTERS], streamed: true });
    assert.ok(isWon(frames));
    await server.shutdown();
  });
});
