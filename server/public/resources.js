export const isStandalone = typeof __STANDALONE__ !== 'undefined';

export const loadResources = () => (
  isStandalone ? Promise.resolve(__RESOURCES__) : fetch('./resources.json').then(res => res.json())
);
