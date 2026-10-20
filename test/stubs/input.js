export const makeInputStub = (answers = [], { pace = null } = {}) => {
  const closing = Promise.withResolvers();
  return {
    answers: [...answers],
    messages: [],
    opened: false,
    closed: false,
    done: closing.promise,

    open() {
      this.opened = true;
    },

    close() {
      this.closed = true;
      closing.resolve();
    },

    async read(message) {
      this.messages.push(message);
      await pace?.();
      if (this.closed || !this.answers.length) return new Promise(() => {});
      return this.answers.shift();
    },
  };
};
