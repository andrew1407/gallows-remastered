import { formatGuessed } from '../../../../scenes/tools.js';

const select = selector => document.querySelector(selector);

export const getElements = () => ({
  stage: select('#sprites-stage'),
  canvas: select('#sprites-canvas'),
  word: select('#tab-word'),
  message: select('#tab-message'),
  tries: select('#tab-tries'),
  characterDialogue: select('#tab-character-dialogue'),
  runnerDialogue: select('#tab-runner-dialogue'),
  letterInput: select('#letter-input > input'),
  submit: select('#submit-button'),
  restart: select('#restart-button'),
  info: select('#info-button'),
  exit: select('#exit-button'),
  startOptions: select('#start-options'),
  play: select('#play-button'),
  offline: select('#offline-toggle > input'),
  addressField: select('#online-address'),
  address: select('#online-address > input'),
});

export const makeTabs = (elements, texts) => {
  const { word, message, tries, characterDialogue, runnerDialogue } = elements;
  characterDialogue.textContent = texts.characterDialogue;
  runnerDialogue.textContent = texts.runnerDialogue;
  return {
    set characterDialogueVisible(value) {
      characterDialogue.hidden = !value;
    },
    set runnerDialogueVisible(value) {
      runnerDialogue.hidden = !value;
    },
    get messageVisible() {
      return !message.hidden;
    },
    set messageVisible(value) {
      message.hidden = !value;
    },
    set message(text) {
      message.textContent = text;
    },
    set tries(value) {
      tries.hidden = false;
      tries.textContent = 'Tries: ' + value;
    },
    set word(guessed) {
      word.textContent = formatGuessed(guessed);
    },
    set guessingVisible(value) {
      tries.hidden = word.hidden = !value;
    },
    initialize() {
      this.characterDialogueVisible = false;
      this.runnerDialogueVisible = false;
      this.guessingVisible = false;
      this.messageVisible = false;
    },
    resetState() {
      this.characterDialogueVisible = false;
      this.runnerDialogueVisible = false;
      this.message = '';
      word.textContent = '';
      this.guessingVisible = false;
    },
  };
};

export const makeInputField = input => ({
  get text() {
    return input.value;
  },
  set text(value) {
    input.value = value;
  },
  activate() {
    if (input !== document.activeElement) input.focus();
  },
});

export const makeStartOptions = ({ startOptions, play, offline, addressField, address }) => ({
  get offline() {
    return offline.checked;
  },
  get address() {
    return address.value;
  },
  set address(value) {
    address.value = value;
  },
  set addressVisible(value) {
    addressField.hidden = !value;
  },
  set visible(value) {
    startOptions.hidden = !value;
  },
  activateAddress() {
    address.focus();
  },
  onToggle(fn) {
    offline.onchange = () => fn(offline.checked);
  },
  onStart(fn) {
    play.onclick = fn;
    address.onkeydown = e => e.key === 'Enter' ? fn() : undefined;
  },
});
