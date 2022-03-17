export const strategies = {
  streamable: 'streamable',
  dataraw: 'dataraw',
};

export const connections = {
  ws: 'ws',
  http: 'http',
};

export const parseArgv = value => {
  const [ strategy, connection = connections.ws ] = value.slice(2).split('-');
  const strategyExists = Object.values(strategies).includes(strategy);
  const connectionExists = Object.values(connections).includes(connection);
  if (!(connectionExists && strategyExists)) return null;
  const stramableMode = strategy === strategies.streamable;
  if (stramableMode && connection !== connections.ws) return null;
  return { strategy, connection };
};

export const defaultStrategy = parseArgv('--streamable');
