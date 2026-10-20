import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { defaultLocations, makeStaticHandler } from '../../server/static.js';

const makeResponse = () => ({
  statusCode: 200,
  headers: {},
  body: undefined,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  end(body) {
    this.body = body?.toString();
  },
});

const request = async (handler, url, method = 'GET') => {
  const res = makeResponse();
  await handler({ url, method }, res);
  return res;
};

describe('static handler', () => {
  const env = { host: 'localhost', port: 1, redis: 'secret', ws: {} };
  const components = { strategy: 'dataraw', connection: 'http' };
  let root;
  let handler;

  before(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'gallows-static-'));
    await mkdir(path.join(root, 'resources'));
    await mkdir(path.join(root, 'broken.css'));
    await writeFile(path.join(root, 'index.html'), '<html>');
    await writeFile(path.join(root, 'env.json'), JSON.stringify(env));
    await writeFile(path.join(root, 'logo.png'), 'png');
    await writeFile(path.join(root, 'notes.unknown'), 'text');
    await writeFile(path.join(root, 'resources', 'words.txt'), 'secret');
    for (const dir of ['.git', 'node_modules']) {
      await mkdir(path.join(root, dir));
      await writeFile(path.join(root, dir, 'config.js'), 'secret');
    }
    await writeFile(path.join(root, '.env'), 'secret');
    handler = makeStaticHandler({ components, env }, {
      staticPaths: [root],
      resourcesDir: path.join(root, 'resources'),
      envFile: path.join(root, 'env.json'),
    });
  });

  after(() => rm(root, { recursive: true, force: true }));

  it('serves files with their mime types', async () => {
    const tests = {
      '/': ['text/html', '<html>'],
      '/index.html?version=1': ['text/html', '<html>'],
      '/logo.png': ['image/png', 'png'],
      '/notes.unknown': ['text/plain', 'text'],
    };
    for (const url in tests) {
      const res = await request(handler, url);
      assert.deepEqual([res.headers['Content-Type'], res.body], tests[url], url);
    }
  });

  it('serves filtered env params instead of the raw config', async () => {
    for (const url of ['/env.json', '/env.json?raw']) {
      const res = await request(handler, url);
      assert.deepEqual(JSON.parse(res.body), { host: 'localhost', port: 1, components });
    }
  });

  it('serves the preloaded resources once', async () => {
    const first = await request(handler, '/resources.json');
    const second = await request(handler, '/resources.json');
    assert.equal(JSON.parse(first.body).words.length, 13);
    assert.equal(first.body, second.body);
  });

  it('hides resources, dot and node_modules paths, missing files and unreadable paths', async () => {
    const urls = ['/resources/words.txt', '/.git/config.js', '/.env', '/node_modules/config.js', '/missing.js', '/broken.css', 'relative.js'];
    for (const url of urls)
      assert.equal((await request(handler, url)).statusCode, 404, url);
  });

  it('ignores non GET requests and exposes default locations', async () => {
    const res = await request(handler, '/', 'POST');
    assert.equal(res.body, undefined);
    assert.ok(defaultLocations.envFile.endsWith(path.join('server', 'env.json')));
    assert.equal(defaultLocations.staticPaths.length, 3);
  });
});
