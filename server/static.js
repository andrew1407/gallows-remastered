import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseUrl } from 'node:url';
import { getEnv } from './env.js';
import { filterEnvFields } from './formatters.js';

const { __dirname } = getEnv(import.meta.url);

const mimeTypes = Object.freeze({
  js: 'application/javascript',
  json: 'application/json',
  css: 'text/css',
  html: 'text/html',
  text: 'text/plain',
});

const resourcesDir = path.join(__dirname, '..', 'resources');
const envFile = path.join(__dirname, 'env.json');
const mainTemplate = '/index.html';

const staticPaths = [
  path.join(__dirname, 'public'),
  __dirname,
  path.join(__dirname, '..'),
];

const fileExists = file => access(file).then(() => true).catch(() => false);

const buildFullPath = async file => {
  if (!file.startsWith('/') || file.includes('..')) return null;
  const compareMapper = staticPaths.map(p => {
    const fullPath = path.join(p, file);
    return fileExists(fullPath).then(ex => ex ? fullPath : null);
  });
  const existingPaths = await Promise.all(compareMapper);
  const fullPath = existingPaths.find(p => !!p) ?? null;
  if (!fullPath) return fullPath;
  return fullPath.startsWith(resourcesDir) ? null : fullPath;
};

const formatParams = (raw, components) => {
  const parsed = JSON.parse(raw);
  parsed.components = components;
  filterEnvFields(parsed);
  return JSON.stringify(parsed);
};

export const makeStaticHandler = components => async (req, res) => {
  if (req.method !== 'GET') return;
  const file = parseUrl(req.url, true).pathname;
  const filename = file === '/' ? mainTemplate : file;
  const fullPath = await buildFullPath(filename);
  if (!fullPath) {
    res.statusCode = 404;
    return res.end();
  }
  const type = filename.slice(filename.lastIndexOf('.') + 1);
  res.setHeader('Content-Type', mimeTypes[type] ?? mimeTypes.text);
  try {
    const entries = await readFile(fullPath);
    const fileData = fullPath === envFile ? formatParams(entries, components) : entries;
    res.end(fileData);
  } catch {
    res.statusCode = 404;
    res.end();
  }
};
