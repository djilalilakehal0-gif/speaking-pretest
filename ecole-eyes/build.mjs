// Builds the app into www/ (used by the website and by Capacitor for the Android app).
//   ECOLE_EYES_PROXY_URL  address of the AI proxy (worker/), built into the app
//   ECOLE_EYES_APP_TOKEN  optional shared token the proxy checks
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const out = 'www';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('public', out, { recursive: true });
cpSync('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', `${out}/pdf.worker.min.mjs`);

const options = {
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'esm',
  target: ['chrome89', 'safari15'],
  minify: true,
  sourcemap: false,
  outfile: `${out}/app.js`,
  define: {
    __PROXY_URL__: JSON.stringify(process.env.ECOLE_EYES_PROXY_URL || ''),
    __APP_TOKEN__: JSON.stringify(process.env.ECOLE_EYES_APP_TOKEN || ''),
  },
  logLevel: 'info',
};

if (process.argv.includes('--serve')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: out, port: 8080 });
  console.log(`école eyes: http://localhost:${port}/`);
} else {
  await esbuild.build(options);
}
