export const ATLAS_PADDING = 2;
export const ATLAS_MAX_WIDTH = 2048;
export const SQUARE_SIZE = 4;

export const packAtlas = (sizes, maxWidth = ATLAS_MAX_WIDTH, padding = ATLAS_PADDING) => {
  const order = sizes.map((_, i) => i).sort((a, b) => sizes[b].height - sizes[a].height);
  const rects = Array(sizes.length);
  let x = padding, y = padding, shelf = 0, width = 0;
  for (const i of order) {
    const { width: w, height: h } = sizes[i];
    if (x + w + padding > maxWidth) {
      x = padding;
      y += shelf + padding;
      shelf = 0;
    }
    rects[i] = { x, y, width: w, height: h };
    x += w + padding;
    shelf = Math.max(shelf, h);
    width = Math.max(width, x);
  }
  return { width, height: y + shelf + padding, rects };
};

export const buildAtlas = (images, createCanvas) => {
  const entries = Object.entries(images);
  const sizes = entries.map(([, image]) => image ?? { width: SQUARE_SIZE, height: SQUARE_SIZE });
  const { width, height, rects } = packAtlas(sizes);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  const regions = {};
  entries.forEach(([key, image], i) => {
    const { x, y, width: w, height: h } = rects[i];
    if (image) context.drawImage(image, x, y);
    else context.fillRect(x, y, w, h);
    regions[key] = {
      width: w,
      height: h,
      u0: x / width,
      v0: y / height,
      u1: (x + w) / width,
      v1: (y + h) / height,
    };
  });
  return { canvas, width, height, regions };
};
