import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultStrategy, parseArgv } from './strategiesTooling.js';
import envParams from './env.json' assert { type: 'json' };

export const getEnv = metaUrl => {
  const __filename = fileURLToPath(metaUrl);
  const __dirname = path.dirname(__filename);
  return Object.freeze({ __filename, __dirname });
};

export const parseComponents = () => {
  const params = { ...defaultStrategy };
  const { components } = envParams;
  if (components?.strategy) {
    Object.assign(params, components);
    return params;
  }
  const fromArgv = process.argv.map(parseArgv).find(s => !!s);
  if (fromArgv) Object.assign(params, fromArgv);
  return params;
};
