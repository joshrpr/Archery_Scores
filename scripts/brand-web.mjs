import { readFileSync, writeFileSync } from 'node:fs';
// Always read the unbranded frozen artwork and the maintained vector composition.
// Never read a generated logo/icon as an input to another export.
const source = readFileSync(new URL('../assets/brand/ranch-source.png', import.meta.url));
const master = readFileSync(new URL('../assets/brand/ranch-horizon.svg', import.meta.url), 'utf8');
writeFileSync(new URL('../ibo-scorer/icons/ranch-horizon.svg', import.meta.url),
  master.replace('ranch-source.png', 'data:image/png;base64,' + source.toString('base64')));
console.log('Generated self-contained Ranch Horizon web mark from the frozen ranch source.');
