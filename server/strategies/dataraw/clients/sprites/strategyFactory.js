import HttpClientStrategy from './http.js';
import WebSocketClientStrategy from './ws.js';
import { makeFetcher } from '../tools.js';
import { makeLocalFetcher } from '../../services/local.js';

const onlineStrategies = Object.freeze({
  'http:': url => new HttpClientStrategy(makeFetcher({ origin: url.origin })),
  'ws:': url => new WebSocketClientStrategy(url.href),
});

export const makeStrategyFactory = loaded => Object.freeze({
  offline: () => new HttpClientStrategy(makeLocalFetcher(loaded)),
  online: address => {
    const url = new URL(address);
    if (!Object.hasOwn(onlineStrategies, url.protocol)) throw new TypeError(`unsupported scheme: ${url.protocol}`);
    return onlineStrategies[url.protocol](url);
  },
});
