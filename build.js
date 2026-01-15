const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// background.js bundle
esbuild.build({
    entryPoints: ['background.js'],
    bundle: true,
    outfile: 'dist/background.js',
    platform: 'browser',
    format: 'esm', // Service Workers are ESM
    target: ['es2020'],
    external: ['/icons/*'], // keep assets external
    alias: {
        // Transformers.js often polyfills fs/path, but distinct for browser
    },
    define: {
        'process.env.NODE_ENV': '"production"'
    }
}).then(() => console.log('Background built'));

// Popup script bundle (if needed, but it's simple)
esbuild.build({
    entryPoints: ['src/popup.js', 'src/offscreen.js'],
    bundle: true,
    outdir: 'dist',
    platform: 'browser'
}).then(() => console.log('Popup/Offscreen built'));
