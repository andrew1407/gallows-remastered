import crypto from 'node:crypto';
import { makePlayerDataValidator } from '../../../../scenes/difficulty.js';
import { loadData } from '../../../setup.js';
import events from '../events.js';
import { labels } from '../../../../scenes/tools.js';
import { parseInputData } from '../loader.js';

const sendData = (socket, data) => new Promise((res, rej) => (
  socket.send(JSON.stringify(data), err => err ? rej(err) : res())
));

const makeConnectionHandler = (dbClient, resources) => async socket => {
  const id = crypto.randomUUID();
  socket.onclose = () => dbClient.removePlayer(id);
  socket.onmessage = async e => {
    const { event, data } = parseInputData(e.data);
    const handler = events[event];
    if (!handler) return;
    const { end, data: handled } = await handler({ dbClient, data, id, resources });
    if (end) return socket.close();
    await sendData(socket, { event, data: handled });
  };

  const data = { stage: labels.difficulty };
  await dbClient.writePlayerData(id, { ...data, playing: false });
  await sendData(socket, { event: 'nextStage', data });
}

export const handleConnection = async (services, staticHandler) => {
  const loaded = await loadData();
  const createPlayerData = makePlayerDataValidator(loaded.words);
  const onSocketConnection = makeConnectionHandler(services.dbClient, { createPlayerData, loaded });
  services.ws.on('connection', onSocketConnection);
  services.http.on('request', async (req, res) => {
    await staticHandler(req, res);
    res.end();
  });
};
