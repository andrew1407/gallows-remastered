export const fromStorageFormat = ({ ...data }) => {
  if ('playing' in data) data.playing = data.playing === 'true';
  if ('multipleLetters' in data) data.multipleLetters = data.multipleLetters === 'true';
  if ('tries' in data) data.tries = parseInt(data.tries, 10);
  if ('guessed' in data) data.guessed = [ ...data.guessed ].map(l => l === ' ' ? null : l);
  if ('left' in data) data.left = [ ...data.left ].map(l => l === ' ' ? null : l);
  return data;
};

export const toStorageFormat = ({ ...data }) => {
  if ('guessed' in data) data.guessed = data.guessed.map(l => l ?? ' ').join('');
  if ('left' in data) data.left = data.left.map(l => l ?? ' ').join('');
  return data;
};

const removeFields = (obj, ...fields) => fields.forEach(f => delete obj[f]);

export const filterDataFields = obj => removeFields(obj, 'playing', 'left', 'multipleLetters');

export const filterEnvFields = obj => removeFields(obj, 'redis', 'upd', 'ws');
