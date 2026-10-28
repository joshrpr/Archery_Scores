// Throwaway, read-only studies. Serves only the named prototype documents.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const folder = new URL('../assets/prototypes/vegas-arrow/', import.meta.url);
const initial = process.argv.includes('--rapid-fire') ? 'rapid-fire.html' : process.argv.includes('--celebration') ? 'celebration.html' : process.argv.includes('--impact') ? 'impact.html' : 'index.html';
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const name = url.pathname === '/' ? initial : ['/index.html', '/impact.html', '/celebration.html', '/rapid-fire.html'].includes(url.pathname) ? url.pathname.slice(1) : null;
  if (!name) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(readFileSync(new URL(name, folder)));
});
server.listen(0, '127.0.0.1', () => console.log(`Arrow prototype (${initial}): http://127.0.0.1:${server.address().port}/`));
