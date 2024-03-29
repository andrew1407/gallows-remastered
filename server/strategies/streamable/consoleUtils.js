import crypto from 'node:crypto';
import { fromStorageFormat, toStorageFormat } from '../../formatters.js';
import { initialStages, execStage } from './stages.js';
import { loadData } from '../../setup.js';
import { makePlayerDataValidator } from '../../../scenes/difficulty.js';

export const closed = s => s.readyState === s.CLOSED;

export const makeConnectionHandler = (dbClient, resources) => async socket => {
  const id = crypto.randomUUID();
  socket.onclose = () => dbClient.removePlayer(id);
  socket.onmessage = async e => {
    const input = e.data;
    if (!await dbClient.playerExists(id)) return;
    let playerData = fromStorageFormat(await dbClient.readPlayerData(id));
    const { playing, stage } = playerData;
    const interractive = stage in initialStages;
    if (playing || !interractive) return;

    await dbClient.writePlayerData(id, { playing: true });
    for (let next = initialStages[stage]; !!next;) {
      await dbClient.writePlayerData(id, { stage: next.label });
      const params = { socket, resources, input, data: playerData }
      const stageData = await execStage(next, params);
      const data = stageData?.data;
      next = stageData?.next;
      if (data) {
        await dbClient.writePlayerData(id, toStorageFormat(data));
        playerData = fromStorageFormat(await dbClient.readPlayerData(id));
      }
    }
    if (!closed(socket)) await dbClient.writePlayerData(id, { playing: false });
  };
  const startStage = Symbol.for('start');
  const { data } = await execStage(initialStages[startStage], { socket, resources });
  await dbClient.writePlayerData(id, toStorageFormat(data));
};

export const makeServiceDescriptor = ({ service, connectionAdapter = null }) => async (services, staticHandler) => {
  const resources = await loadData();
  resources.createPlayerData = makePlayerDataValidator(resources.words);
  const onSocketConnection = makeConnectionHandler(services.dbClient, resources);
  const connectionHandler = !connectionAdapter ? onSocketConnection : s => onSocketConnection(connectionAdapter(s));
  services[service].on('connection', connectionHandler);
  services.http.on('request', async (req, res) => {
    await staticHandler(req, res);
    res.end();
  });
};
