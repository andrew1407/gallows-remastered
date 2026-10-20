export const strategies = {
  streamable: 'streamable',
  dataraw: 'dataraw',
};

export const connections = Object.freeze({
  ws: 'ws',
  http: 'http',
  udp: 'udp',
  tcp: 'tcp',
});

export const parseArgv = value => {
  const [ strategy, connection = connections.ws ] = value.slice(2).split('-');
  const strategyExists = Object.values(strategies).includes(strategy);
  const connectionExists = Object.values(connections).includes(connection);
  if (!(connectionExists && strategyExists)) return null;
  const stramableMode = strategy === strategies.streamable;
  if (stramableMode && connection !== connections.ws) return null;
  return { strategy, connection };
};

export const defaultStrategy = Object.freeze(parseArgv('--streamable'));

export const makeMessagesReader = () => {
  let buffered = '';
  let scanned = 0;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  return chunk => {
    buffered += chunk;
    const messages = [];
    let start = 0;
    for (; scanned < buffered.length; ++scanned) {
      const char = buffered[scanned];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') {
        quoted = true;
      } else if (char === '{') {
        ++depth;
      } else if (char === '}' && --depth === 0) {
        messages.push(buffered.slice(start, scanned + 1));
        start = scanned + 1;
      }
    }
    buffered = buffered.slice(start);
    scanned -= start;
    return messages;
  };
};
