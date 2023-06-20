import { closed, makeServiceDescriptor } from '../consoleUtils.js';
import { connections } from '../../../strategiesTooling.js';

const makeSocketWrapper = socket => ({
  readyState: 0,

  get CLOSED() {
    return 1;
  },

  set onclose(fn) {
    socket.on('close', () => this.close(fn));
  },

  set onmessage(fn) {
    socket.on('data', buf => fn({ data: buf.toString() }));
  },

  send(data, clb) {
    if (!closed(this)) socket.write(data, clb);
  },

  close(clb) {
    this.readyState = this.CLOSED;
    try {
      socket.destroy();
      clb?.();
    } catch (e) {
      clb?.(e);
    }
  },
});

export const handleConnection = makeServiceDescriptor({
  service: connections.tcp,
  connectionAdapter: makeSocketWrapper,
});
