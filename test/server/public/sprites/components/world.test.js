import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Clouds from '../../../../../server/public/sprites/components/clouds.js';
import Hanger from '../../../../../server/public/sprites/components/hanger.js';
import MainCharacter, { animationStates, bodyParts } from '../../../../../server/public/sprites/components/mainCharacter.js';
import Runner from '../../../../../server/public/sprites/components/runner.js';
import SpriteNode from '../../../../../server/public/sprites/components/spriteNode.js';
import World, { VIEW, characterMovement } from '../../../../../server/public/sprites/components/world.js';
import { FLOATS_PER_INSTANCE, MAX_INSTANCES, makeInstanceBuffer } from '../../../../../server/public/sprites/render/instances.js';
import { makeRegions } from '../../../../stubs/sprites.js';

const runFor = (target, seconds, dt = 0.1) => {
  for (let t = 0; t < seconds; t += dt) target.update(dt);
};

describe('scene components', () => {
  it('recycles clouds once they leave the view', () => {
    const node = SpriteNode.of('clouds');
    const clouds = new Clouds(node, { direction: 1, speed: 10, halfWidth: 1 });
    assert.equal(node.x, -14);
    clouds.update(0.1, VIEW.halfWidth);
    assert.equal(node.x, -13);
    runFor({ update: dt => clouds.update(dt, VIEW.halfWidth) }, 2.3);
    assert.equal(node.x, -14);
  });

  it('drops hanger parts along the curve and resets them', () => {
    const hanger = new Hanger();
    const [post] = hanger.parts;
    const [postNode] = hanger.nodes;
    assert.equal(postNode.y, 8);
    post.startMove();
    runFor(hanger, 1.5);
    assert.equal(post.moving, false);
    assert.equal(postNode.y, 0);
    hanger.resetState();
    assert.equal(postNode.y, 8);
    assert.equal(hanger.nodes.length, 7);
  });

  it('walks, jumps and shows body parts of the main character', () => {
    const character = new MainCharacter();
    const walking = character.move(characterMovement.center);
    walking.next();
    assert.equal(character.currentState, animationStates.WALKING);
    runFor(character, 5);
    assert.equal(walking.next().done, true);
    assert.equal(character.currentState, animationStates.STANDING);
    assert.equal(character.transform.x, 0);

    const jumping = character.jump(characterMovement.jump);
    jumping.next();
    runFor(character, 1);
    jumping.next();
    assert.equal(character.transform.y, 0);

    character.bodyVisible = false;
    character.setBodyPartVisible(bodyParts.TORSO);
    assert.equal(character.bodyVisible, false);
    assert.equal(character.nodes.filter(n => n.visible).length, 1);
    character.resetState();
    assert.deepEqual([character.transform.x, character.bodyVisible, character.currentState], [-12, true, animationStates.IDLE]);
  });

  it('runs the runner across the screen', () => {
    const runner = new Runner();
    assert.equal(runner.nodes[0].x, -11.04);
    runner.resetState();
    runner.startRun();
    runFor(runner, 0.5);
    assert.equal(runner.running, true);
    assert.ok(runner.bounds.left > -12);
    runFor(runner, 3);
    assert.equal(runner.running, false);
  });

  it('updates the world, catches the character and writes instances', () => {
    const world = new World(makeRegions());
    const buffer = makeInstanceBuffer();
    const count = world.writeInstances(buffer);
    assert.equal(count, 19);
    assert.equal(buffer.length, FLOATS_PER_INSTANCE * MAX_INSTANCES);
    assert.equal(buffer[0 * FLOATS_PER_INSTANCE + 12], 1);

    Object.assign(world.mainCharacter.transform, characterMovement.center);
    world.runner.resetState();
    world.runner.startRun();
    runFor(world, 1);
    assert.equal(world.mainCharacter.bodyVisible, false);

    world.resetState();
    assert.equal(world.mainCharacter.bodyVisible, true);
    const flipped = world.writeInstances(buffer);
    const second = buffer.subarray(2 * FLOATS_PER_INSTANCE, 3 * FLOATS_PER_INSTANCE);
    assert.equal(second[4], 1);
    assert.equal(second[6], 0);
    assert.ok(flipped > 0);
  });

  it('caps the number of written instances', () => {
    const nodes = Object.getOwnPropertyDescriptor(Hanger.prototype, 'nodes');
    Object.defineProperty(Hanger.prototype, 'nodes', {
      configurable: true,
      get: () => Array.from({ length: MAX_INSTANCES }, () => SpriteNode.of('stool', { order: 2 })),
    });
    try {
      const world = new World(makeRegions());
      assert.equal(world.writeInstances(makeInstanceBuffer()), MAX_INSTANCES);
    } finally {
      Object.defineProperty(Hanger.prototype, 'nodes', nodes);
    }
  });
});
