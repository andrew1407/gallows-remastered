import crypto from 'node:crypto';
import { fromStorageFormat, toStorageFormat } from '../../../formatters.js';
import { initialStages, execStage } from '../stages.js';
import { loadData } from '../../../setup.js';
import { makePlayerDataValidator } from '../../../../scenes/difficulty.js';
import { closed } from '../consoleUtils.js';

const makeSocketWrapper = (server, info) => ({
  readyState: 0,
  get CLOSED() {
    return 1;
  },
  send: (data, clb) => server.send(data, info.port, info.address, clb),
  close(clb) {
    this.readyState = this.CLOSED;
    clb?.();
  },
});

const makeRequestHandler = (server, dbClient, resources) => async (message, info) => {
  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch {
    return;
  }
  const { id, initial, input } = parsed;
  const socket = makeSocketWrapper(server, info);
  if (initial) {
    const id = crypto.randomUUID();
    await { then: res => socket.send('id: ' + id, res) };
    const startStage = Symbol.for('start');
    const { data } = await execStage(initialStages[startStage], { socket, resources });
    await dbClient.writePlayerData(id, toStorageFormat(data));
  }
  if (!await dbClient.playerExists(id)) return;
  let playerData = fromStorageFormat(await dbClient.readPlayerData(id));
  const { playing, stage } = playerData;
  const interractive = stage in initialStages;
  if (playing || !interractive) return;
  await dbClient.writePlayerData(id, { playing: true });
  for (let next = initialStages[stage]; !!next;) {
    await dbClient.writePlayerData(id, { stage: next.label });
    const params = { socket, resources, input, data: playerData };
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

export const handleConnection = async (services, staticHandler) => {
  const resources = await loadData();
  resources.createPlayerData = makePlayerDataValidator(resources.words);
  const onMessage = makeRequestHandler(services.udp, services.dbClient, resources);
  services.udp.on('message', onMessage);
  services.http.on('request', async (req, res) => {
    await staticHandler(req, res);
    res.end();
  });
};
