// Keep the offline browser/Android copies reproducible from the pinned package.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
const source = new URL('../node_modules/three/', import.meta.url);
const destination = new URL('../ibo-scorer/vendor/three/', import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('package.json', source), 'utf8'));
if (version !== '0.180.0') throw new Error('Review renderer compatibility before updating the pinned Three.js version.');
mkdirSync(destination, { recursive: true });
for (const file of ['three.module.min.js', 'three.core.min.js']) copyFileSync(new URL('build/' + file, source), new URL(file, destination));
copyFileSync(new URL('LICENSE', source), new URL('LICENSE', destination));
