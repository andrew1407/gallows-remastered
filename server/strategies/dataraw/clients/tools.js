import { inputMessages } from '../../../../extra.js';
import { frameDecorator, labels } from '../../../../scenes/tools.js';

export const makeSocketLoader = (socket, playerData) => iteartor => ({
  then(res) {
    const event = 'resource';
    iteartor.resolvers[event] = res;
    socket.send(JSON.stringify({ event, id: playerData.id }));
  },
});

export const makeFetchLoader = (fetcher, playerData) => iteartor => {
  const body = {
    id: playerData.id,
    data: { input: iteartor.input },
  };
  return fetcher('/resource', body).then(res => res.data);
};

const makeScenesIterator = ({ playerData, resourceLoader }) => ({
  inputMessages: {
    [labels.difficulty]: inputMessages[labels.difficulty] + ' ',
    [labels.gameplay]: `\n${inputMessages.gameplay} `,
  },
  playing: false,
  hashedValue: null,
  input: '',

  interractive: ({ playerData: { stage } }) => [labels.gameplay, labels.difficulty].includes(stage),

  async getValue() {
    if (!this.hashedValue) this.hashedValue = {
      playerData,
      frames: await resourceLoader(this),
      passInput: input => this.input = input,
      inputMessage: this.inputMessages[playerData.stage] ?? '',
    };
    return this.hashedValue;
  },
});

export const makeSocketScenesIterator = ({ socket, playerData, resourceLoader, inform }) => ({
  ...makeScenesIterator({ playerData, resourceLoader }),
  resolvers: {
    nextStage: null,
    resource: null,
  },

  stageRequest() {
    return {
      then: res => {
        const data = { input: this.input };
        const event = 'nextStage';
        this.resolvers[event] = res;
        const entriesToSend = { event, data };
        if (inform) {
          entriesToSend.data.initial = !playerData.id;
          entriesToSend.id = playerData.id;
        }
        socket.send(JSON.stringify(entriesToSend));
      },
    };
  },

  [Symbol.asyncIterator]() {
    socket.onclose = () => {
      for (const key in this.resolvers) this.resolvers[key]?.(null);
    };
    socket.onmessage = e => {
      const { event, data } = JSON.parse(e.data);
      if (!this.resolvers[event]) return;
      this.resolvers[event]?.(data);
      this.resolvers[event] = null;
    };
    return {
      next: async () => {
        if (this.playing) return { value: await this.getValue() };
        this.playing = true;
        const data = await this.stageRequest();
        if (!data) {
          this.playing = false;
          return { done: true };
        }
        playerData.fill(data);
        let value;
        if (playerData.stage === labels.win) {
          const prev = this.hashedValue.frames.map(f => ({ ...f, after: 1500 }));
          this.hashedValue = null;
          value = await this.getValue();
          value.frames.unshift(...frameDecorator(prev, playerData));
        } else {
          this.hashedValue = null;
          value = await this.getValue();
        }
        this.playing = false;
        return { value };
      },
    };
  }
});

export const makeFetchScenesIterator = ({ fetcher, playerData, resourceLoader }) => ({
  ...makeScenesIterator({ playerData, resourceLoader }),
  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        if (this.playing) return { value: await this.getValue() };
        this.playing = true;
        const { end, data } = await fetcher('/nextStage', {
          id: playerData.id,
          data: { input: this.input, initial: !playerData.id },
        });
        if (end) {
          this.playing = false;
          return { done: true };
        }
        playerData.fill(data);
        let value;
        if (playerData.stage === labels.win) {
          const prev = this.hashedValue.frames.map(f => ({ ...f, after: 1500 }));
          this.hashedValue = null;
          value = await this.getValue();
          value.frames.unshift(...frameDecorator(prev, playerData));
        } else {
          this.hashedValue = null;
          value = await this.getValue();
        }
        this.playing = false;
        return { value };
      },
    };
  }
});
