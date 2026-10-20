import { makeServiceDescriptor } from '../connection.js';
import { connections, makeMessagesReader } from '../../../strategiesTooling.js';

const makeSocketWrapper = socket => ({
  readyState: 0,

  get CLOSED() {
    return 1;
  },

  set onclose(fn) {
    socket.on('close', fn);
  },

  set onmessage(fn) {
    const readMessages = makeMessagesReader();
    socket.setEncoding('utf8');
    socket.on('data', chunk => {
      for (const data of readMessages(chunk)) fn({ data });
    });
  },

  send(data, clb) {
    socket.write(data, clb);
  },

  close(clb) {
    this.readyState = this.CLOSED;
    socket.end(clb);
  },
});

export const handleConnection = makeServiceDescriptor({
  service: connections.tcp,
  connectionAdapter: makeSocketWrapper,
});
