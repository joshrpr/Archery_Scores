// Maintained source contract shared by all web and native exports.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const normalizedTextSha256=bytes=>sha256(bytes.toString('utf8').replace(/\r\n/g,'\n'));
const source = readFileSync(new URL('../assets/brand/ranch-source.png', import.meta.url));
export const sourceSha256 = 'a81e5cda39728ad27a526366565280a16c286db39fd4650e1734d4304be2dc25';
if (sha256(source) !== sourceSha256) throw new Error('Frozen original ranch artwork changed; restore the approved source before exporting.');
const master = readFileSync(new URL('../assets/brand/ranch-horizon.svg', import.meta.url), 'utf8');
if ((master.match(/href="ranch-source.png"/g) || []).length !== 1 || /data:image/.test(master)) throw new Error('Master must reference the frozen original artwork exactly once, never a generated export.');
export const mark = master.replace('ranch-source.png', 'data:image/png;base64,' + source.toString('base64'));
export const aerial = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="48 200 416 280"><image width="512" height="512" href="data:image/png;base64,' + source.toString('base64') + '"/></svg>';
