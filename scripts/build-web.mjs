// Copy the web app in ibo-scorer/ into www/, the folder Capacitor bundles into
// the Android app. Tests, docs and the service worker stay behind: the app ships
// its files inside the APK and updates by installing a newer APK instead.
import { cpSync, rmSync } from 'node:fs';
import { basename } from 'node:path';

const SKIP = new Set(['tests', 'README.md', 'sw.js']);
rmSync('www', { recursive: true, force: true });
cpSync('ibo-scorer', 'www', { recursive: true, filter: src => !SKIP.has(basename(src)) });
console.log('Copied ibo-scorer/ to www/');
