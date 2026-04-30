import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd());
const preferredPort = Number(process.env.PORT || process.argv[2] || 4174);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function fileFor(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const clean = normalize(pathname).replace(/^([/\\])+/, '');
  const target = resolve(join(root, clean || 'index.html'));
  if (!target.startsWith(root)) return null;
  if (existsSync(target) && statSync(target).isDirectory()) return join(target, 'index.html');
  return target;
}

function listen(port) {
  const server = createServer((req, res) => {
    let target = fileFor(req.url || '/');
    if (!target || !existsSync(target)) target = join(root, 'index.html');
    res.setHeader('Content-Type', types[extname(target).toLowerCase()] || 'application/octet-stream');
    createReadStream(target).pipe(res);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') listen(port + 1);
    else throw err;
  });
  server.listen(port, () => {
    console.log(`Open http://localhost:${port}/`);
  });
}

listen(preferredPort);
