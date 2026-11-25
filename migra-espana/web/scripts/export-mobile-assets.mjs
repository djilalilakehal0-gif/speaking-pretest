// Single source of truth: exports the web dictionaries + legal seed to JSON assets for the Flutter app.
import { build } from 'esbuild'; import { writeFileSync, mkdirSync } from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const tmp = path.resolve('node_modules/.cache-mobile-export.mjs');
await build({ stdin: { contents: "export { DICTIONARIES } from '@/i18n'; export { PATHWAYS } from '@/lib/legal/pathways'; export { SOURCES, RESOURCES } from '@/lib/legal/sources'; export { RULES_SNAPSHOT_DATE } from '@/lib/eligibility/engine'; export { HELP_ORGS, HELP_SOURCE } from '@/lib/legal/help';", resolveDir: path.resolve('.'), loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: tmp, alias: { '@': path.resolve('src') } });
const m = await import(pathToFileURL(tmp).href);
const out = path.resolve('../mobile/assets'); mkdirSync(out + '/i18n', { recursive: true });
for (const [l, d] of Object.entries(m.DICTIONARIES)) writeFileSync(`${out}/i18n/${l}.json`, JSON.stringify(d));
writeFileSync(`${out}/legal.json`, JSON.stringify({ snapshot: m.RULES_SNAPSHOT_DATE, pathways: m.PATHWAYS, sources: m.SOURCES, resources: m.RESOURCES, help: { orgs: m.HELP_ORGS, source: m.HELP_SOURCE } }));
console.log('exported', Object.keys(m.DICTIONARIES).length, 'languages,', m.PATHWAYS.length, 'pathways');
