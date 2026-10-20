export const FLOATS_PER_INSTANCE = 16;
export const MAX_INSTANCES = 64;

export const makeInstanceBuffer = () => new Float32Array(FLOATS_PER_INSTANCE * MAX_INSTANCES);

export const writeInstance = (buffer, index, node, region, { ppu, filter }) => {
  const o = index * FLOATS_PER_INSTANCE;
  const flipped = node.scaleX < 0;
  buffer[o] = node.worldX;
  buffer[o + 1] = node.worldY;
  buffer[o + 2] = region.width / ppu * Math.abs(node.scaleX) / 2;
  buffer[o + 3] = region.height / ppu * Math.abs(node.scaleY) / 2;
  buffer[o + 4] = flipped ? region.u1 : region.u0;
  buffer[o + 5] = region.v0;
  buffer[o + 6] = flipped ? region.u0 : region.u1;
  buffer[o + 7] = region.v1;
  buffer.set(node.tint, o + 8);
  buffer[o + 12] = filter;
};
