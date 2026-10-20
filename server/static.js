import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { getEnv } from './env.js';
import { filterEnvFields } from './formatters.js';
import { loadData } from './setup.js';

const { __dirname } = getEnv(import.meta.url);

const mimeTypes = Object.freeze({
  js: 'application/javascript',
  json: 'application/json',
  css: 'text/css',
  html: 'text/html',
  text: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  ttf: 'font/ttf',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
});

const mainTemplate = '/index.html';
const hiddenPath = /\/(\.|node_modules\/)/;

export const defaultLocations = Object.freeze({
  resourcesDir: path.join(__dirname, '..', 'resources'),
  envFile: path.join(__dirname, 'env.json'),
  staticPaths: [
    path.join(__dirname, 'public'),
    __dirname,
    path.join(__dirname, '..'),
  ],
});

const fileExists = file => access(file).then(() => true).catch(() => false);

const buildFullPath = async (file, { staticPaths, resourcesDir }) => {
  if (!file.startsWith('/') || file.includes('..') || hiddenPath.test(file)) return null;
  const compareMapper = staticPaths.map(p => {
    const fullPath = path.join(p, file);
    return fileExists(fullPath).then(ex => ex ? fullPath : null);
  });
  const existingPaths = await Promise.all(compareMapper);
  const fullPath = existingPaths.find(p => !!p) ?? null;
  if (!fullPath) return fullPath;
  return fullPath.startsWith(resourcesDir) ? null : fullPath;
};

const formatParams = (env, components) => {
  const params = { ...env, components };
  filterEnvFields(params);
  return JSON.stringify(params);
};

const getType = filename => mimeTypes[filename.slice(filename.lastIndexOf('.') + 1)] ?? mimeTypes.text;

export const makeStaticHandler = ({ components, env }, locations = defaultLocations) => {
  let resources = null;
  const virtualFiles = {
    '/env.json': () => formatParams(env, components),
    '/resources.json': () => resources ??= loadData().then(loaded => JSON.stringify(loaded)),
  };

  return async (req, res) => {
    if (req.method !== 'GET') return;
    const file = new URL(req.url, 'http://localhost').pathname;
    const filename = file === '/' ? mainTemplate : file;
    res.setHeader('Content-Type', getType(filename));
    if (Object.hasOwn(virtualFiles, filename)) return res.end(await virtualFiles[filename]());
    const fullPath = await buildFullPath(filename, locations);
    if (!fullPath) {
      res.statusCode = 404;
      return res.end();
    }
    try {
      const entries = await readFile(fullPath);
      res.end(fullPath === locations.envFile ? formatParams(env, components) : entries);
    } catch {
      res.statusCode = 404;
      res.end();
    }
  };
};
