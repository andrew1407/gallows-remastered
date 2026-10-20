import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Animator, { makeClip } from '../../../../../server/public/sprites/components/animator.js';
import { evaluateCurve } from '../../../../../server/public/sprites/components/curve.js';
import MovementController, { movementStates } from '../../../../../server/public/sprites/components/movement.js';
import SpriteNode, { getBounds } from '../../../../../server/public/sprites/components/spriteNode.js';
import { SQUARE, filters, spriteUrl, sprites } from '../../../../../server/public/sprites/components/catalog.js';

describe('sprite primitives', () => {
  it('evaluates a clamped hermite curve through its keys', () => {
    const keys = [
      { time: 0, value: 0, slope: 0 },
      { time: 1, value: 1, slope: 0 },
    ];
    assert.equal(evaluateCurve(keys, -1), 0);
    assert.equal(evaluateCurve(keys, 0.5), 0.5);
    assert.equal(evaluateCurve(keys, 2), 1);
    assert.ok(evaluateCurve(keys, 0.25) < 0.25);
  });

  it('animates looping and single frame clips', () => {
    const clips = {
      loop: makeClip([['a', 0], ['b', 0.5]], 1),
      still: makeClip([['c', 0]]),
    };
    const animator = new Animator(clips, 'loop');
    assert.equal(animator.sprite, 'a');
    animator.update(0.6);
    assert.equal(animator.sprite, 'b');
    animator.update(0.5);
    assert.equal(animator.sprite, 'a');
    animator.play('loop');
    assert.equal(animator.sprite, 'a');
    animator.play('still');
    animator.update(5);
    assert.equal([animator.state, animator.sprite].join(), 'still,c');
  });

  it('moves towards a destination with walk and jump speeds', () => {
    const node = { x: 0, y: 0 };
    const movement = new MovementController(node, { walkSpeed: 1, jumpSpeed: 2 });
    movement.action(1);
    movement.go({ x: 3, y: 0 });
    movement.action(1);
    assert.deepEqual([node.x, movement.state], [1, movement.state]);
    movement.action(5);
    assert.deepEqual([node.x, movement.state], [3, movementStates.IDLE]);
    movement.jump({ x: 3, y: 1 });
    movement.action(0.25);
    assert.equal(node.y, 0.5);
    assert.equal(movement.state, movementStates.JUMP);
  });

  it('composes node positions through parents and colliders', () => {
    const parent = SpriteNode.of(null, { x: 1, y: 2 });
    const child = SpriteNode.of('head', { x: 1, parent });
    assert.deepEqual([child.worldX, child.worldY], [2, 2]);
    assert.deepEqual(getBounds(child, { x: 0, y: 1, width: 2, height: 4 }), { left: 1, right: 3, bottom: 1, top: 5 });
  });

  it('catalogs every sprite with its import settings', () => {
    assert.equal(sprites[SQUARE].file, null);
    assert.equal(sprites.sky.filter, filters.BILINEAR);
    assert.equal(sprites.body1.ppu, 13);
    assert.match(spriteUrl('sky.jpg'), /assets\/sprites\/sky\.jpg$/);
  });
});
