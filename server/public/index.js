const DEFAULT_VERSION = '0';

const versions = Object.freeze({
  0: { container: '#ascii-version', load: () => import('./ascii/index.js') },
  1: { container: '#sprites-version', load: () => import('./sprites/index.js') },
});

const requested = new URLSearchParams(location.search).get('version');
const version = versions[Object.hasOwn(versions, requested) ? requested : DEFAULT_VERSION];
document.querySelector(version.container).hidden = false;
const { launch } = await version.load();
await launch();
