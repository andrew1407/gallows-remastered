import { v4 as uuid4 } from 'uuid';
import { makePlayerDataValidator } from '../../../../scenes/difficulty.js';
import { labels } from '../../../../scenes/tools.js';
import { loadData } from '../../../setup.js';
import events from '../events.js';
import { parseInputData } from '../loader.js';

const routes = {
  '/currentStats': events.currentStats,
  '/resource': events.resource,
  '/nextStage': async params => {
    if (!params.data.initial) return events.nextStage(params);
    const id = uuid4();
    const stage = labels.difficulty;
    const data = { id, stage };
    await params.dbClient.writePlayerData(id, { stage, playing: false });
    return { data };
  },
};

const readJson = async req => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  return parseInputData(body);
};

const makeRequestHandler = (dbClient, resources) => async (req, res) => {
  if (req.method !== 'POST') return;
  const route = req.url;
  if (!(route in routes)) {
    res.statusCode = 404;
    return res.end();
  }
  const { id, data } = await readJson(req);
  if (!(id || data)) {
    res.statusCode = 403;
    return res.end();
  }
  if (id && !(await dbClient.playerExists(id))) {
    res.statusCode = 404;
    return res.end();
  }
  const stageRoute = route === '/nextStage';
  if (!(id || stageRoute || data?.initial)) {
    res.statusCode = 403;
    return res.end();
  }
  const handled = await routes[route]({ dbClient, resources, data, id });
  if (handled.end) await dbClient.removePlayer(id);
  res.end(JSON.stringify(handled));
};

export const handleConnection = async (services, staticHandler) => {
  const loaded = await loadData();
  const createPlayerData = makePlayerDataValidator(loaded.words);
  const resources = { loaded, createPlayerData };
  const handleGameplay = makeRequestHandler(services.dbClient, resources);
  services.http.on('request', async (req, res) => {
    await staticHandler(req, res);
    if (req.method === 'GET') return res.end();
    await handleGameplay?.(req, res);
    res.end();
  });
};
