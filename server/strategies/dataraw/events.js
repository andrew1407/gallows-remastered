import { filterDataFields, fromStorageFormat, toStorageFormat } from '../../formatters.js';
import { loadRecourse } from './loader.js';
import stages from './stages.js';

const currentStats = async ({ id, dbClient }) => {
  const data = fromStorageFormat(await dbClient.readPlayerData(id));
  filterDataFields(data);
  return { data };
};

const resource = async ({ id, dbClient, resources }) => {
  const playerData = fromStorageFormat(await dbClient.readPlayerData(id));
  return {
    data: loadRecourse(playerData, resources.loaded),
  };
};

const nextStage = async ({ id, dbClient, data, resources }) => {
  if (!await dbClient.playerExists(id)) return;
  const playerData = fromStorageFormat(await dbClient.readPlayerData(id));
  const { playing, stage } = playerData;
  if (playing) return { end: false };
  await dbClient.writePlayerData(id, { playing: true });
  const eventHandler = stages[stage];
  const params = { resources, playerData, input: data.input };
  const gainedData = await eventHandler(params);
  if (!gainedData) return { end: true };
  const storageData = { ...toStorageFormat(gainedData), playing: false };
  await dbClient.writePlayerData(id, storageData);
  const written = fromStorageFormat(await dbClient.readPlayerData(id));
  filterDataFields(written);
  return { end: false, data: written };
};

export default { currentStats, nextStage, resource };
