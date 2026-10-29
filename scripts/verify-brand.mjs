// Pure-Node delivery guard: CI consumes committed raster assets, not a browser download.
import { readFileSync } from 'node:fs';
import { sourceSha256, sha256 as sha, normalizedTextSha256 as shaText } from './brand-source.mjs';
const root = new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root));
const provenance=JSON.parse(read('assets/brand/exports.json'));
function check(ok,what){if(!ok)throw new Error(`${what} differs from the approved export record. Run npm run brand:raster and review the regenerated artwork.`);}
check(provenance.sourceSha256===sourceSha256,'Frozen ranch source');
check(provenance.masterSha256===shaText(read('assets/brand/ranch-horizon.svg')),'Maintained composition');
check(provenance.generatorSha256===shaText(read('scripts/brand-raster.mjs')),'Raster generator');
for(const [path,hash] of Object.entries(provenance.outputs))check(sha(read(path))===hash,path);
console.log(`Verified ${Object.keys(provenance.outputs).length} committed Ranch Horizon exports against frozen source and maintained composition.`);
