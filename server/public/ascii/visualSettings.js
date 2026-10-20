export default class VisualSettings {
  #settingsElements = null;
  #gameplayElements = null;
  #bodyElement = document.querySelector('body');
  #defalutPallete = {
    fontColor: "#00FFFF",
    backgroundColor: '#000000',
  };

  constructor(settingsElements, gameplayElements) {
    this.#settingsElements = settingsElements;
    this.#gameplayElements = gameplayElements;
  }

  get elementsToSlyle() {
    return [
      this.#bodyElement,
      this.#gameplayElements.inputArea,
      this.#gameplayElements.sendButton,
    ];
  }

  setFontColor(color) {
    for (const el of this.elementsToSlyle)
      el.style.borderColor = el.style.color = color;
  };

  setBackgroundColor(color) {
    for (const el of this.elementsToSlyle) el.style.backgroundColor = color;
  };

  resetSettings() {
    this.#setDefaultColorInput();
    this.setFontColor(this.#defalutPallete.fontColor);
    this.setBackgroundColor(this.#defalutPallete.backgroundColor);
  }

  get settingsOpened() {
    return window.getComputedStyle(this.#settingsElements.settingsContainer).display === 'flex';
  }

  toggleSettings(opened = !this.settingsOpened) {
    this.#settingsElements.settingsContainer.style.display = opened ? 'flex' : 'none';
    const { inputArea } = this.#gameplayElements;
    if (!opened && !inputArea.disabled) inputArea.focus();
  }

  setInitialBehaviour() {
    this.#settingsElements.toggleSettings.onclick = () => this.toggleSettings();
    document.addEventListener('click', e => {
      if (this.settingsOpened && !this.#settingsElements.gameSettings.contains(e.target))
        this.toggleSettings(false);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.settingsOpened) this.toggleSettings(false);
    });
    this.#settingsElements.gameFontColor.oninput = e => this.setFontColor(e.target.value);
    this.#settingsElements.gameBackgroundColor.oninput = e => this.setBackgroundColor(e.target.value);
    this.#settingsElements.resetSettings.onclick = () => this.resetSettings();
    this.resetSettings();
    return this;
  }

  #setDefaultColorInput() {
    this.#settingsElements.gameFontColor.value = this.#defalutPallete.fontColor;
    this.#settingsElements.gameBackgroundColor.value = this.#defalutPallete.backgroundColor;
  }
};
