const fs = require('fs');
const { build, context } = require('esbuild');

const buildConfigs = [
  {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    minify: true,
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    outfile: './out/native/extension.js',
    external: ['vscode'],
  },
];

const highlightThemes = [
  'default.css',
  'dark.css',
  'github.css',
  'github-dark.css',
  'monokai.css',
  'pojoaque.css',
  'vs.css',
];

function copyHighlightThemes() {
  const themeDirectory = './out/highlightjs';
  fs.mkdirSync(themeDirectory, { recursive: true });
  for (const theme of highlightThemes) {
    fs.copyFileSync(
      `./node_modules/highlight.js/styles/${theme}`,
      `${themeDirectory}/${theme}`,
    );
  }
}

function copyPreviewAssets() {
  fs.cpSync('./media/webview', './out/webview', { recursive: true });
  fs.cpSync('./media/preview_theme', './out/preview_theme', {
    recursive: true,
  });
}

function cleanGeneratedFiles() {
  fs.rmSync('./out', { recursive: true, force: true });
}

async function buildAll() {
  cleanGeneratedFiles();
  await Promise.all(buildConfigs.map((config) => build(config)));
  copyPreviewAssets();
  copyHighlightThemes();
  console.log('Native Markdown preview extension built.');
}

async function watchAll() {
  cleanGeneratedFiles();
  fs.mkdirSync('./out', { recursive: true });
  copyPreviewAssets();
  copyHighlightThemes();
  const contexts = await Promise.all(
    buildConfigs.map((config) => context(config)),
  );
  await Promise.all(contexts.map((buildContext) => buildContext.watch()));
  console.log('Watching native and web Markdown preview builds.');
}

const task = process.argv.includes('--watch') ? watchAll : buildAll;
task().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
