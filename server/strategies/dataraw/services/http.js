import { loadData } from '../../../setup.js';
import { parseInputData } from '../loader.js';
import { makeResources, makeRouter } from '../routes.js';

const corsHeaders = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Private-Network': 'true',
});

const readJson = async req => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  return parseInputData(body);
};

const makeRequestHandler = router => async (req, res) => {
  for (const header in corsHeaders) res.setHeader(header, corsHeaders[header]);
  if (req.method === 'OPTIONS') return void(res.statusCode = 204);
  if (req.method !== 'POST') return;
  const [status, body] = await router(req.url, await readJson(req));
  res.statusCode = status;
  if (body) res.write(JSON.stringify(body));
};

export const handleConnection = async (services, staticHandler) => {
  const resources = makeResources(await loadData());
  const handleGameplay = makeRequestHandler(makeRouter(services.dbClient, resources));
  services.http.on('request', async (req, res) => {
    await staticHandler(req, res);
    if (req.method === 'GET') return res.end();
    await handleGameplay(req, res);
    res.end();
  });
};
