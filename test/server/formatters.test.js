import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { filterDataFields, filterEnvFields, fromStorageFormat, toStorageFormat } from '../../server/formatters.js';

describe('formatters', () => {
  it('converts player data to and from the storage format', () => {
    const stored = toStorageFormat({ guessed: ['a', null], left: [null, 'b'], tries: 3 });
    assert.deepEqual(stored, { guessed: 'a ', left: ' b', tries: 3 });
    assert.deepEqual(fromStorageFormat({ ...stored, tries: '3', playing: 'true', multipleLetters: 'false' }), {
      guessed: ['a', null],
      left: [null, 'b'],
      tries: 3,
      playing: true,
      multipleLetters: false,
    });
  });

  it('removes private fields in place', () => {
    const data = { playing: true, left: [], multipleLetters: true, stage: 'gameplay' };
    filterDataFields(data);
    assert.deepEqual(data, { stage: 'gameplay' });
    const env = { redis: 'url', upd: {}, ws: {}, host: 'h' };
    filterEnvFields(env);
    assert.deepEqual(env, { host: 'h' });
  });
});
