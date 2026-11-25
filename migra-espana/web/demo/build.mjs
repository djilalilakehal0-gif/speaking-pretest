import { build } from 'esbuild'; import { readFileSync, writeFileSync } from 'node:fs'; import path from 'node:path';
const out = process.argv[2];
const r = await build({ entryPoints: ['demo/entry.ts'], bundle: true, minify: true, write: false, format: 'iife', target: 'es2020', alias: { '@': path.resolve('src') }, loader: { '.ts': 'ts', '.jpg': 'dataurl' } });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
writeFileSync(out, readFileSync('demo/shell.html', 'utf8') + `<script>${js}</script>\n`);
console.log('bytes', Buffer.byteLength(readFileSync(out)));
