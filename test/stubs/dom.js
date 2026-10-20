import { mock } from 'node:test';

export const installDocument = () => void(globalThis.document = { activeElement: null });

export const makeElement = (props = {}) => ({
  style: {},
  textContent: '',
  innerHTML: '',
  value: '',
  disabled: false,
  hidden: false,
  focus() {
    globalThis.document.activeElement = this;
  },
  ...props,
});

export const makeAsciiElements = () => ({
  framePresenter: makeElement(),
  inputLabel: makeElement(),
  inputArea: makeElement(),
  sendButton: makeElement(),
  inputPanel: makeElement(),
});

const QUIET_TURNS = 30;

export const waitQuiet = async read => {
  let last = read();
  for (let quiet = 0; quiet < QUIET_TURNS; ++quiet) {
    mock.timers.runAll();
    await new Promise(setImmediate);
    const current = read();
    if (current !== last) quiet = 0;
    last = current;
  }
};

export const submitAnswers = async (elements, answers, { read = () => elements.framePresenter.textContent } = {}) => {
  for (const answer of answers) {
    await waitQuiet(read);
    elements.inputArea.value = answer;
    elements.sendButton.onclick();
  }
};
