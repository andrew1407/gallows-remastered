import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import InputReader from '../../../io/input.js';

const makeStreams = () => ({ input: new PassThrough(), output: new PassThrough() });

describe('InputReader', () => {
  it('asks a question and resolves the answer', async () => {
    const streams = makeStreams();
    const reader = new InputReader(streams);
    reader.open();
    const answer = reader.read('Letter: ');
    streams.input.write('a\n');
    assert.equal(await answer, 'a');
    assert.match(streams.output.read().toString(), /Letter: /);
    reader.close();
  });

  it('closes after reading when requested and notifies the close handler', async () => {
    const streams = makeStreams();
    let closed = 0;
    const reader = new InputReader({ ...streams, onClose: () => ++closed });
    reader.open();
    const answer = reader.read(undefined, { close: true });
    streams.input.write('2\n');
    assert.equal(await answer, '2');
    assert.equal(closed, 1);
  });

  it('ignores reads and closes before opening', () => {
    const reader = new InputReader();
    reader.close();
    assert.ok(reader.read('?') instanceof Promise);
  });
});
