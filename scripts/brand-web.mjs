// Pure Node: safe to run in every web/Android build without a browser download.
import { writeFileSync } from 'node:fs';
import { mark, aerial } from './brand-source.mjs';
writeFileSync(new URL('../ibo-scorer/icons/ranch-horizon.svg', import.meta.url), mark);
writeFileSync(new URL('../ibo-scorer/icons/ranch-aerial.svg', import.meta.url), aerial);
console.log('Generated self-contained Ranch Horizon web mark from the frozen original artwork.');
