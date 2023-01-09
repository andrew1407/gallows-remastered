import { setTimeout } from 'node:timers/promises';
import { scenePlayer } from '../../../../../io/output.js';
import { makeSocketScenesIterator, makeSocketLoader } from '../tools.js';
import { makeFileLoader, runScenes } from '../consoleUtils.js';
import { consoleOutput, playerDataContainer } from '../../../../../extra.js';
import envParams from '../../../../env.json' assert { type: 'json' };

const port = envParams.udp.port ?? envParams.port + 1;
const host = envParams.udp.host ?? envParams.host;

const socketStates = {
  OPEN: 1,
  NONE: 2,
  CLOSED: 3,
};

class SocketInterfaceAdapter {
  #socket = null;
  #state = socketStates.OPEN;

  constructor(socket) {
    this.#socket = socket;
  }

  set onmessage(fn) {
    this.#socket.on('message', data => fn({ data }));
  }

  set onclose(fn) {
    this.#socket.on('close', () => {
      this.#state = socketStates.CLOSED;
      fn();
    });
  }

  get readyState() {
    return this.#state;
  }

  send(data) {
    this.#socket.send(data, port, host);
  }
}

export const runApp = async ({ socket: socketRaw, input }) => {
  const playerData = playerDataContainer();
  const socket = new SocketInterfaceAdapter(socketRaw);
  const resourceLoader = makeSocketLoader(socket, playerData);
  // const resourceLoader = makeFileLoader(playerData);
  const inform = true;
  const scenes = makeSocketScenesIterator({ resourceLoader, playerData, socket, inform });
  const playFrames = frames => scenePlayer(frames, consoleOutput, setTimeout);
  input.open();
  await runScenes({ socket, scenes, input, playFrames });
  input.close();
  socketRaw.close();
};
