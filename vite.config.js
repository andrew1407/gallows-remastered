import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { loadData } from './server/setup.js';

// `npm run build` only: the browser app stays a no-build ES-module site served by the server; this folds
// both versions, their sprites, font and the game resources into one self-contained dist/index.html.

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(root, 'server/public');
const FAVICON = 'images/logo.png';

// Vite keeps favicons as sibling files, so the icon goes in as a data: URI before the HTML is processed.
const inlineFavicon = () => ({
  name: 'gallows-singlefile-favicon',
  transformIndexHtml: {
    order: 'pre',
    handler: html => {
      const icon = readFileSync(resolve(publicDir, FAVICON)).toString('base64');
      return html.replace(`href="./${FAVICON}"`, `href="data:image/png;base64,${icon}"`);
    },
  },
});

// Folded back in at writeBundle, so Vite has finished its own chunk rewrites.
const inlineEverything = () => ({
  name: 'gallows-singlefile-inline',
  enforce: 'post',
  writeBundle(opts, bundle) {
    const html = Object.values(bundle).find(f => f.fileName.endsWith('.html'));
    if (!html) this.error('no HTML emitted');
    let out = html.source;
    for (const file of Object.values(bundle)) {
      if (file === html) continue;
      if (file.type === 'chunk' && file.fileName.endsWith('.js')) {
        // `</script` inside the code would close the tag early; `<\/` is the same string to JS.
        const code = file.code.replace(/<\/(script)/gi, '<\\/$1');
        out = out.replace(
          new RegExp(`<script[^>]*src="[^"]*${file.fileName}"[^>]*></script>`),
          () => `<script type="module">\n${code}\n</script>`
        );
      } else if (file.fileName.endsWith('.css')) {
        if (/<\/style/i.test(file.source)) this.error('CSS contains `</style`, which cannot be inlined');
        out = out.replace(
          new RegExp(`<link[^>]*href="[^"]*${file.fileName}"[^>]*>`),
          () => `<style>\n${file.source}\n</style>`
        );
      }
    }
    const left = out.match(/(?:src|href)="(?!data:|https?:)[^"]*"/);
    if (left) this.error(`could not inline ${left[0]}`);
    writeFileSync(resolve(opts.dir, html.fileName), out);
    for (const file of Object.values(bundle))
      if (file !== html) unlinkSync(resolve(opts.dir, file.fileName));
  },
});

export default defineConfig(async () => ({
  root: publicDir,
  base: './',
  define: {
    __STANDALONE__: 'true',
    __RESOURCES__: JSON.stringify(await loadData()),
  },
  plugins: [inlineFavicon(), inlineEverything()],
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    modulePreload: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: Infinity,
    rollupOptions: {
      input: resolve(publicDir, 'index.html'),
      output: { codeSplitting: false, entryFileNames: 'app.js', assetFileNames: 'app.[ext]' },
    },
  },
}));
