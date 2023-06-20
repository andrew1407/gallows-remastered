import { makeServiceDescriptor } from '../connection.js';
import { connections } from '../../../strategiesTooling.js';

const makeSocketWrapper = socket => ({
  readyState: 0,

  get CLOSED() {
    return 1;
  },

  set onclose(fn) {
    socket.on('close', fn);
  },

  set onmessage(fn) {
    socket.on('data', buf => fn({ data: buf.toString() }));
  },

  send(data, clb) {
    socket.write(data, clb);
  },

  close(clb) {
    this.readyState = this.CLOSED;
    clb?.();
  },
});

export const handleConnection = makeServiceDescriptor({
  service: connections.tcp,
  connectionAdapter: makeSocketWrapper,
});
