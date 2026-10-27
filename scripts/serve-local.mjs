import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex === -1 ? 4173 : Number(args[portIndex + 1]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('A port 1024 és 65535 közötti egész szám legyen.');
  process.exit(1);
}

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let root;
try {
  root = await realpath(resolve(project, 'dist'));
  await stat(resolve(root, 'index.html'));
} catch {
  console.error('Hiányzik a dist mappa. Csomagold ki a teljes ZIP-et, vagy futtasd: npm ci és npm run build.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const url = `http://127.0.0.1:${port}/`;
const isInside = (path) => {
  const part = relative(root, path);
  return part !== '..' && !part.startsWith(`..${sep}`) && !isAbsolute(part);
};
const server = createServer(async (request, response) => {
  const reject = (status, message) => {
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(message);
  };
  if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(request.headers.host)) {
    reject(403, 'Csak helyi hozzáférés engedélyezett.');
    return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    reject(405, 'Nem támogatott kérés.');
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, url).pathname);
  } catch {
    reject(400, 'Hibás cím.');
    return;
  }
  if (pathname.includes('\\') || pathname.includes('\0')) {
    reject(400, 'Hibás cím.');
    return;
  }
  const requested = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!isInside(requested)) {
    reject(403, 'Tiltott elérési út.');
    return;
  }
  try {
    const file = await realpath(requested);
    if (!isInside(file)) {
      reject(403, 'Tiltott elérési út.');
      return;
    }
    const details = await stat(file);
    if (!details.isFile()) {
      reject(404, 'A fájl nem található.');
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Content-Length': details.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch {
    reject(404, 'A fájl nem található.');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `A ${port}. port már foglalt. Ha a játék már fut, nyisd meg: ${url}\nMásik port: node scripts/serve-local.mjs --port 4174`
    : `Nem sikerült elindítani a helyi oldalt: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
  console.log(`\nKJK Online – Királynők Útvesztője\n\nNyisd meg a böngészőben: ${url}`);
  console.log('Ezt az ablakot hagyd nyitva játék közben. Leállítás: Ctrl+C.');
  console.log('A mentés ebben a böngészőben és ezen a címen marad.\n');
  if (!args.includes('--no-open')) {
    const [command, parameters] = process.platform === 'win32'
      ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
      : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    const browser = spawn(command, parameters, { detached: true, stdio: 'ignore' });
    browser.on('error', () => console.log('Nyisd meg kézzel a fenti címet a böngészőben.'));
    browser.unref();
  }
});
