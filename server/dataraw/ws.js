import { v4 as uuid4 } from 'uuid';
import { makePlayerDataValidator } from '../../scenes/difficulty.js';
import { loadData } from '../setup.js';
import events from './events.js';
import { labels } from '../../scenes/tools.js';

const sendData = (socket, data) => new Promise((res, rej) => (
  socket.send(JSON.stringify(data), err => err ? rej(err) : res())
));

const connectionHandler = (dbClient, resources) => async socket => {
  const id = uuid4();
  socket.onclose = () => dbClient.removePlayer(id);
  socket.onmessage = async e => {
    let parsed;
    try {
      parsed = JSON.parse(e.data);
    } catch {
      return;
    }
    const { event, data } = parsed;
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

export const handleConnection = async ({ dbClient, ws: wsServer }) => {
  const loaded = await loadData();
  const createPlayerData = makePlayerDataValidator(loaded.words);
  const onSocketConnection = connectionHandler(dbClient, { createPlayerData, loaded });
  wsServer.on('connection', onSocketConnection);
};
