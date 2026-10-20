// Chrome on Linux draws the color picker as an in-page popup below the input's left edge and only
// keeps it within the screen, so near the window edges it gets clipped; it is opened from an anchor with room instead
const PICKER_POPUP_SIZE = Object.freeze({ width: 260, height: 300 });

const fitToWindow = (position, size, windowSize) => Math.max(0, Math.min(position, windowSize - size));

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
    this.#bindPickerAnchor();
    this.resetSettings();
    return this;
  }

  #bindPickerAnchor() {
    const { pickerAnchor, gameFontColor, gameBackgroundColor } = this.#settingsElements;
    if (!pickerAnchor?.showPicker) return;
    let target = null;
    pickerAnchor.oninput = e => {
      target.value = e.target.value;
      target.dispatchEvent(new Event('input'));
    };
    for (const input of [gameFontColor, gameBackgroundColor]) {
      input.onclick = e => {
        target = input;
        const { left, bottom } = input.getBoundingClientRect();
        pickerAnchor.style.left = `${fitToWindow(left, PICKER_POPUP_SIZE.width, window.innerWidth)}px`;
        pickerAnchor.style.top = `${fitToWindow(bottom, PICKER_POPUP_SIZE.height, window.innerHeight)}px`;
        pickerAnchor.value = input.value;
        try {
          pickerAnchor.showPicker();
          e.preventDefault();
        } catch {
          // falls back to the input's own picker
        }
      };
    }
  }

  #setDefaultColorInput() {
    this.#settingsElements.gameFontColor.value = this.#defalutPallete.fontColor;
    this.#settingsElements.gameBackgroundColor.value = this.#defalutPallete.backgroundColor;
  }
};
