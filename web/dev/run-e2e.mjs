// Runs every browser check (web/dev/e2e-*.mjs) one after another against a local server.
//   node web/dev/run-e2e.mjs
// Needs Chrome, Chromium or Edge (see find-chrome.mjs; CHROME_PATH overrides, CHROME_NO_SANDBOX=1 for
// Linux containers). The small static server is built in, so no Python or packages are needed.
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { findChrome } from './find-chrome.mjs';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const devDir = fileURLToPath(new URL('.', import.meta.url));
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};

const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(webRoot, path));
    if (!file.startsWith(webRoot.endsWith(sep) ? webRoot : webRoot + sep)) throw Error('outside');
    // A folder without index.html gets an empty page (like python's listing), so checks can seed storage there.
    if (path.endsWith('/index.html') && !(await stat(file).catch(() => null))) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      return response.end('<!doctype html><title>folder</title>');
    }
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;

console.log(`Browser: ${findChrome()}\nServer:  ${url}\n`);
const scripts = (await readdir(devDir)).filter(name => /^e2e-.*\.mjs$/.test(name)).sort();
const results = [];
for (const name of scripts) {
  console.log(`▶ ${name}`);
  const code = await new Promise(resolve => {
    const child = spawn(process.execPath, [join(devDir, name)], { stdio: 'inherit', env: { ...process.env, STORY_URL: url } });
    child.on('exit', resolve);
  });
  results.push({ name, ok: code === 0 });
  console.log(code === 0 ? `✔ ${name}\n` : `✖ ${name} (exit ${code})\n`);
}
server.close();
for (const { name, ok } of results) console.log(`${ok ? '✔' : '✖'} ${name}`);
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} browser checks passed`);
process.exit(failed ? 1 : 0);
