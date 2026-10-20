import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { isStandalone, loadResources } from '../../../server/public/resources.js';

describe('browser resources', () => {
  afterEach(() => mock.restoreAll());

  it('fetches the preloaded resources from the server', async () => {
    const fetchStub = mock.method(globalThis, 'fetch', async url => ({ json: async () => ({ url }) }));
    assert.equal(isStandalone, false);
    assert.deepEqual(await loadResources(), { url: './resources.json' });
    assert.equal(fetchStub.mock.callCount(), 1);
  });
});
