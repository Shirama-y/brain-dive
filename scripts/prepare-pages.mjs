import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const output = new URL('docs/', root);
await readFile(new URL('index.html', dist));
// docs/ contains only generated GitHub Pages output; source lives in src/.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(dist, output, { recursive: true });
await writeFile(new URL('.nojekyll', output), '');
console.log(`GitHub Pages output: ${fileURLToPath(output)}`);
