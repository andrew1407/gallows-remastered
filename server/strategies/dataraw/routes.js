import { makePlayerDataValidator } from '../../../gameControls.js';
import { labels } from '../../../scenes/tools.js';
import events from './events.js';

const routes = {
  '/currentStats': events.currentStats,
  '/resource': events.resource,
  '/nextStage': async params => {
    if (!params.data.initial) return events.nextStage(params);
    const id = crypto.randomUUID();
    const stage = labels.difficulty;
    const data = { id, stage };
    await params.dbClient.writePlayerData(id, { stage, playing: false });
    return { data };
  },
};

const makeTuple = (status, body = null) => [status, body];

export const makeResources = loaded => ({
  loaded,
  createPlayerData: makePlayerDataValidator(loaded.words),
});

export const makeRouter = (dbClient, resources) => async (route, { id, data } = {}) => {
  if (!Object.hasOwn(routes, route)) return makeTuple(404);
  if (!(id || data)) return makeTuple(403);
  if (id && !(await dbClient.playerExists(id))) return makeTuple(404);
  const stageRoute = route === '/nextStage';
  if (!(id || stageRoute || data?.initial)) return makeTuple(403);
  const handled = await routes[route]({ dbClient, resources, data: data ?? {}, id });
  if (handled.end) await dbClient.removePlayer(id);
  return makeTuple(200, handled);
};
