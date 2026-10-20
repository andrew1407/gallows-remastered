import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEnv, parseComponents } from '../../server/env.js';
import { connections, defaultStrategy, makeMessagesReader, parseArgv, strategies } from '../../server/strategiesTooling.js';

describe('env', () => {
  it('resolves module paths', () => {
    const { __filename, __dirname } = getEnv(import.meta.url);
    assert.ok(__filename.endsWith('env.test.js'));
    assert.ok(__dirname.endsWith('server'));
  });

  it('prefers configured components, then argv, then the default', () => {
    const components = { strategy: strategies.dataraw, connection: connections.tcp };
    assert.deepEqual(parseComponents({ components }), components);
    assert.deepEqual(parseComponents({}, ['node', '--dataraw-udp']), { strategy: 'dataraw', connection: 'udp' });
    assert.deepEqual(parseComponents({ components: {} }, ['node']), defaultStrategy);
    assert.deepEqual(parseComponents({}), defaultStrategy);
  });

  it('reads whole json messages out of a byte stream', () => {
    const read = makeMessagesReader();
    const message = JSON.stringify({ event: 'nextStage', data: { frame: '}{ "\\ {' } });
    assert.deepEqual(read(`${message}{"a":`), [message]);
    assert.deepEqual(read('1}'), ['{"a":1}']);
    assert.deepEqual(read(message.slice(0, 20)), []);
    assert.deepEqual(read(message.slice(20) + message), [message, message]);
    assert.deepEqual(read(Buffer.from('{"b":2}')), ['{"b":2}']);
  });

  it('parses strategy flags', () => {
    const tests = {
      '--streamable': { strategy: 'streamable', connection: 'ws' },
      '--dataraw-http': { strategy: 'dataraw', connection: 'http' },
      '--streamable-tcp': null,
      '--unknown-ws': null,
      '--dataraw-smtp': null,
    };
    for (const flag in tests) assert.deepEqual(parseArgv(flag), tests[flag], flag);
  });
});
