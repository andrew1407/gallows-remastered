import { readFile, access } from 'fs/promises';
import path from 'path';
import { getEnv } from './env.js';

const { __dirname } = getEnv(import.meta.url);

const mimeTypes = {
  js: 'application/javascript',
  json: 'application/json',
  css: 'text/css',
  html: 'text/html',
};

const resourcesDir = path.join(__dirname, '..', 'resources');

const staticPaths = [
  path.join(__dirname, 'public'),
  __dirname,
  path.join(__dirname, '..'),
];

const mainTemplate = '/index.html';

const fileExists = file => access(file).then(() => true).catch(() => false);

const buildFullPath = async file => {
  if (!file.startsWith('/') || file.includes('..')) return null;
  const compareMapper = staticPaths.map(async p => {
    const fullPath = path.join(p, file);
    return (await fileExists(fullPath)) ? fullPath : null;
  });
  const existingPaths = await Promise.all(compareMapper);
  const fullPath = existingPaths.find(p => !!p) ?? null;
  if (!fullPath) return fullPath;
  return fullPath.startsWith(resourcesDir) ? null : fullPath;
};

const gamemodeTemplate = val => `gamemode="${val}"`;
const gamemodePattern = new RegExp(gamemodeTemplate('GAMEMODE_STRATEGY'), 'g');

const editMainTemplate = (data, strategy) => data.replace(gamemodePattern, gamemodeTemplate(strategy));

export const makeStaticHandler = strategy => async (req, res) => {
  if (req.method !== 'GET') return;
  const file = req.url;
  const isIcon = file === '/favicon.ico'
  if (isIcon) {
    res.statusCode = 404;
    return res.end();
  }
  const filename = file === '/' ? mainTemplate : file;
  const fullPath = await buildFullPath(filename);
  if (!fullPath) {
    res.statusCode = 404;
    return res.end();
  }
  const type = filename.slice(filename.lastIndexOf('.') + 1);
  if (type in mimeTypes) res.setHeader('Content-Type', mimeTypes[type]);

  try {
    const entries = await readFile(fullPath);
    const fileData = filename === mainTemplate ?
      editMainTemplate(entries.toString(), strategy) : entries;
    res.end(fileData);
  } catch {
    res.statusCode = 404;
    res.end();
  }
};
