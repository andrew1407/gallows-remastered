const WHITE = Object.freeze([1, 1, 1, 1]);

export const getBounds = (node, collider) => {
  const x = node.worldX + collider.x;
  const y = node.worldY + collider.y;
  return {
    left: x - collider.width / 2,
    right: x + collider.width / 2,
    bottom: y - collider.height / 2,
    top: y + collider.height / 2,
  };
};

export default class SpriteNode {
  sprite = null;
  x = 0;
  y = 0;
  scaleX = 1;
  scaleY = 1;
  order = 0;
  visible = true;
  parent = null;
  tint = WHITE;

  static of(sprite, params) {
    return Object.assign(new SpriteNode(), { sprite, ...params });
  }

  get worldX() {
    return this.x + (this.parent?.worldX ?? 0);
  }

  get worldY() {
    return this.y + (this.parent?.worldY ?? 0);
  }
}
