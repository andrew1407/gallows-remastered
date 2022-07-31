import { v4 as uuid4 } from 'uuid';
import { makePlayerDataValidator } from '../../../../scenes/difficulty.js';
import { loadData } from '../../../setup.js';
import events from '../events.js';
import { labels } from '../../../../scenes/tools.js';

const sendData = (server, data, info) => server.send(JSON.stringify(data), info.port, info.address);

const makeRequestHandler = (server, dbClient, resources) => async (message, info) => {
  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch {
    return;
  }
  const { id, event, data } = parsed ?? {};
  const eventHandler = events[event];
  if (!eventHandler) return;
  const stageEvent = event === 'nextStage';
  if (!(id || stageEvent || data?.initial)) return;
  const params = { dbClient, data, id, resources };
  const dataToSend = { event, data: null };
  if (stageEvent && params.data.initial) {
    const id = uuid4();
    const stage = labels.difficulty;
    dataToSend.data = { id, stage };
    await params.dbClient.writePlayerData(id, { stage, playing: false });
    return sendData(server, dataToSend, info);
  }
  const idNotFound = id && !(await dbClient.playerExists(id));
  if (!id || idNotFound) return;
  const { end, data: handled } = await eventHandler(params);
  if (end) await dbClient.removePlayer(id);
  dataToSend.data = handled;
  sendData(server, dataToSend, info);
};

export const handleConnection = async (services, staticHandler) => {
  const loaded = await loadData();
  const createPlayerData = makePlayerDataValidator(loaded.words);
  const handleMessage = makeRequestHandler(services.udp, services.dbClient, { createPlayerData, loaded });
  services.udp.on('message', handleMessage);
  services.http.on('request', async (req, res) => {
    await staticHandler(req, res);
    res.end();
  });
};

