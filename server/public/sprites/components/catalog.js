export const filters = Object.freeze({
  POINT: 0,
  BILINEAR: 1,
});

const sprite = (file, ppu, filter = filters.POINT) => Object.freeze({ file, ppu, filter });

export const SQUARE = 'square';

export const sprites = Object.freeze({
  sky: sprite('sky.jpg', 100, filters.BILINEAR),
  clouds: sprite('clouds.png', 100, filters.BILINEAR),
  ground: sprite('ground.png', 370, filters.BILINEAR),
  head: sprite('head.png', 13),
  torso: sprite('torso.png', 13),
  leftHand: sprite('left-hand.png', 13),
  leftLeg: sprite('left-leg.png', 13),
  rightHand: sprite('right-hand.png', 13),
  rightLeg: sprite('right-leg.png', 13),
  body1: sprite('body-1.png', 13),
  body2: sprite('body-2.png', 13),
  bodyHanged: sprite('body-hanged.png', 13),
  bodyTalking: sprite('body-talking.png', 13),
  bodyWalking1: sprite('body-walking-1.png', 13),
  bodyWalking2: sprite('body-walking-2.png', 13),
  win1: sprite('win-1.png', 13),
  win2: sprite('win-2.png', 13),
  runner1: sprite('runner-1.png', 13),
  runner2: sprite('runner-2.png', 13),
  hanger1: sprite('hanger-1.png', 10),
  hanger2: sprite('hanger-2.png', 10),
  hanger3: sprite('hanger-3.png', 10),
  hanger4: sprite('hanger-4.png', 10),
  stool: sprite('stool.png', 10),
  ropeLoop: sprite('rope-loop.png', 700),
  [SQUARE]: sprite(null, 4),
});

export const spriteUrl = file => new URL(`../assets/sprites/${file}`, import.meta.url).href;
