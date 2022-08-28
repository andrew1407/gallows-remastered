const makeFormatter = formatters => ({ ...data }) => {
  for (const key in formatters)
  if (key in data) formatters[key](data);
  return data;
};

const removeFields = (obj, ...fields) => fields.forEach(f => delete obj[f]);

export const fromStorageFormat = makeFormatter({
  playing: data => data.playing = data.playing === 'true',
  multipleLetters: data => data.multipleLetters = data.multipleLetters === 'true',
  tries: data => data.tries = parseInt(data.tries, 10),
  guessed: data => data.guessed = [ ...data.guessed ].map(l => l === ' ' ? null : l),
  left: data => data.left = [ ...data.left ].map(l => l === ' ' ? null : l),
});

export const toStorageFormat = makeFormatter({
  guessed: data => data.guessed = data.guessed.map(l => l ?? ' ').join(''),
  left: data => data.left = data.left.map(l => l ?? ' ').join(''),
});

export const filterDataFields = obj => removeFields(obj, 'playing', 'left', 'multipleLetters');

export const filterEnvFields = obj => removeFields(obj, 'redis', 'upd', 'ws');
