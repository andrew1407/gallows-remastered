import { mock } from 'node:test';

// Named imports of node:timers/promises are bound before MockTimers can patch them,
// so the builtin is swapped for one backed by the (mockable) global setTimeout.
// Modules under test must be imported dynamically after this call.
export const mockPromiseTimers = () => mock.module('node:timers/promises', {
  exports: {
    setTimeout: (ms, value) => new Promise(resolve => globalThis.setTimeout(resolve, ms, value)),
  },
});

export const useMockTimers = () => mock.timers.enable({ apis: ['setTimeout'] });

export const resetTimers = () => mock.timers.reset();

export const settle = async promise => {
  let done = false;
  promise.then(() => void(done = true), () => void(done = true));
  while (!done) {
    mock.timers.runAll();
    await new Promise(setImmediate);
  }
  return promise;
};
