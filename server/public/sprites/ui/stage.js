export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export const fitStage = ({ stage }, renderer) => {
  const scale = Math.min(innerWidth / STAGE_WIDTH, innerHeight / STAGE_HEIGHT);
  stage.style.setProperty('--stage-scale', scale);
  const ratio = devicePixelRatio || 1;
  renderer.resize(Math.round(STAGE_WIDTH * scale * ratio), Math.round(STAGE_HEIGHT * scale * ratio));
};
