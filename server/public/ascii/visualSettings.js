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

  setInitialBehaviour() {
    this.#settingsElements.toggleSettings.onclick = () => {
      const containerStyle = window.getComputedStyle(this.#settingsElements.settingsContainer);
      const visible = containerStyle.display === 'flex';
      this.#settingsElements.settingsContainer.style.display = visible ? 'none' : 'flex';
    };
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
