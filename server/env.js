import path from 'path';
import { fileURLToPath } from 'url';

export const getEnv = metaUrl => {
  const __filename = fileURLToPath(metaUrl);
  const __dirname = path.dirname(__filename);
  return { __filename, __dirname };
};
