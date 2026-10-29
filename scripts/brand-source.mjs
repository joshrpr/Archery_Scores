// Maintained source contract shared by all web and native exports.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source = readFileSync(new URL('../assets/brand/ranch-source.png', import.meta.url));
export const sourceSha256 = 'a81e5cda39728ad27a526366565280a16c286db39fd4650e1734d4304be2dc25';
if (createHash('sha256').update(source).digest('hex') !== sourceSha256) throw new Error('Frozen original ranch artwork changed; restore the approved source before exporting.');
const master = readFileSync(new URL('../assets/brand/ranch-horizon.svg', import.meta.url), 'utf8');
if ((master.match(/href="ranch-source.png"/g) || []).length !== 1 || /data:image/.test(master)) throw new Error('Master must reference the frozen original artwork exactly once, never a generated export.');
export const mark = master.replace('ranch-source.png', 'data:image/png;base64,' + source.toString('base64'));
