const { build } = require('esbuild');
const fs = require('fs-extra');
const path = require('path');

// Ensure the build directory exists
const buildDir = path.resolve(__dirname, 'build');
fs.ensureDirSync(buildDir);


fs.copySync('./src/popup/index.html', './build/popup/index.html');
fs.copySync('./src/popup/style.css', './build/popup/style.css');

fs.copySync('./src/options/index.html', './build/options/index.html');
fs.copySync('./src/options/style.css', './build/options/style.css');



fs.copySync('./src/content/style.css', './build/content/style.css');


// Bootstrap
fs.copySync('./src/public/bootstrap/bootstrap.bundle.min.js', './build/public/bootstrap/bootstrap.bundle.min.js');
fs.copySync('./src/public/bootstrap/bootstrap.min.css', './build/public/bootstrap/bootstrap.min.css');


// ESBuild build options
const esbuildOptions = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'chrome58',
  platform: 'node',
};

// Build each entry point
const entryPoints = [
  { name: 'popup', entry: './src/popup/popup.js', outdir: 'popup' },
  { name: 'background', entry: './src/script/background.js', outdir: 'background' },
  { name: 'lang-detector', entry: './src/script/lang-detector.js', outdir: 'background' },
  { name: 'base64', entry: './src/script/base64.js', outdir: 'background' },
  { name: 'content', entry: './src/content/content.js', outdir: 'content' },
  { name: 'options', entry: './src/options/options.js', outdir: 'options' }
];

entryPoints.forEach(({ name, entry, outdir }) => {
  build({
    ...esbuildOptions,
    entryPoints: { [name]: entry },
    outdir: path.join(buildDir, outdir),
    
  }).catch(() => process.exit(1));
});
