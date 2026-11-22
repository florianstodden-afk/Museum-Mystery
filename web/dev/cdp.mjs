// A tiny DevTools client for the browser checks: launches Chrome/Edge headless and drives pages.
// No Playwright and no other dependency (Node ≥ 22 has fetch and WebSocket built in).
// CHROME_PATH picks the browser; CHROME_NO_SANDBOX=1 adds --no-sandbox (Linux containers, CI).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findChrome } from './find-chrome.mjs';

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
export const STORY_KEY = 'museum-nocturne-story-v1';
export const WALK_KEY = 'museum-mystery-walk-v1';
export const baseUrl = () => process.env.STORY_URL ?? 'http://127.0.0.1:8011';

export function checker() {
  let count = 0;
  const check = (value, message) => { assert.ok(value, message); count++; console.log(`PASS ${message}`); };
  return { check, get count() { return count; } };
}

const KEYS = {
  Enter: { code: 'Enter', keyCode: 13, text: '\r' }, Escape: { code: 'Escape', keyCode: 27 }, Tab: { code: 'Tab', keyCode: 9 },
  ArrowLeft: { code: 'ArrowLeft', keyCode: 37 }, ArrowUp: { code: 'ArrowUp', keyCode: 38 },
  ArrowRight: { code: 'ArrowRight', keyCode: 39 }, ArrowDown: { code: 'ArrowDown', keyCode: 40 }, ' ': { code: 'Space', keyCode: 32, text: ' ' },
};

export async function launchBrowser() {
  const profile = await mkdtemp(join(tmpdir(), 'nocturne-chrome-'));
  const args = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--mute-audio', 'about:blank'];
  if (process.env.CHROME_NO_SANDBOX === '1') args.unshift('--no-sandbox');
  const chrome = spawn(findChrome(), args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const browserUrl = await new Promise((resolve, reject) => {
    let text = '';
    chrome.stderr.on('data', chunk => {
      text += chunk;
      const match = text.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) resolve(match[1]);
    });
    chrome.on('exit', code => reject(Error(`Browser exited (${code}): ${text}`)));
  });
  const port = new URL(browserUrl).port;

  async function openPage({ shots = null, blockMet = false } = {}) {
    if (shots) await mkdir(shots, { recursive: true });
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let id = 0;
    const pending = new Map();
    const listeners = [];
    socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id && pending.has(message.id)) {
        const { resolve, reject } = pending.get(message.id);
        pending.delete(message.id);
        message.error ? reject(Error(message.error.message)) : resolve(message.result);
      } else if (message.method) for (const l of [...listeners]) l(message);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const errors = [];
    const ignored = /metmuseum\.org|favicon\.ico/;
    listeners.push(({ method, params }) => {
      if (method === 'Runtime.exceptionThrown') errors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
      if (method === 'Runtime.consoleAPICalled' && params.type === 'error') errors.push(params.args.map(a => a.value ?? a.description).join(' '));
      if (method === 'Log.entryAdded' && params.entry.level === 'error' && !ignored.test(params.entry.url ?? '') && !ignored.test(params.entry.text)) errors.push(`${params.entry.text} ${params.entry.url ?? ''}`);
    });
    await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable'].map(m => send(m)));
    if (blockMet) {
      await send('Network.enable');
      await send('Network.setBlockedURLs', { urls: ['*collectionapi.metmuseum.org*'] });
    }
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      return result.result.value;
    };
    const page = {
      errors, send, evaluate,
      async viewport(width, height) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
        await send('Emulation.setTouchEmulationEnabled', { enabled: width < 700, maxTouchPoints: 5 });
      },
      async goto(url) {
        const loaded = new Promise(resolve => listeners.push(m => { if (m.method === 'Page.loadEventFired') resolve(); }));
        await send('Page.navigate', { url });
        await loaded;
        await wait(400);
      },
      async key(key) {
        const known = KEYS[key];
        const code = known?.code ?? `Key${key.toUpperCase()}`;
        const keyCode = known?.keyCode ?? key.toUpperCase().charCodeAt(0);
        const text = known ? known.text : key;
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, text });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
        await wait(250);
      },
      // Clicks the first visible button whose text contains `label` (inside the open dialog if there is one).
      async click(label, scopeSelector = null) {
        const done = await evaluate(`(() => {
          const visible = node => node.getClientRects().length && !node.closest('[hidden]');
          const scope = ${scopeSelector ? `document.querySelector(${JSON.stringify(scopeSelector)})` : `document.querySelector('#dialog:not(.hidden)')`} ?? document;
          const target = [...scope.querySelectorAll('button')].find(b => visible(b) && b.textContent.includes(${JSON.stringify(label)}));
          if (!target) return false;
          target.click();
          return true;
        })()`);
        assert.ok(done, `button "${label}" not found`);
        await wait(300);
      },
      // Mouse click at the centre of the first element matching `selector`.
      async clickAt(selector) {
        const box = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect(); return r && { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
        assert.ok(box, `${selector} not found`);
        for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
        await wait(250);
      },
      dialogText: () => evaluate(`document.querySelector('#dialog:not(.hidden)')?.textContent ?? ''`),
      story: () => evaluate(`JSON.parse(JSON.parse(localStorage.getItem('${STORY_KEY}')).story)`),
      // Names of elements in the open dialog/journal (or the page) that need scrolling.
      scrolls: (selectors = '#dialog:not(.hidden), #dialog:not(.hidden) *, .journal-book, .journal-book *') => evaluate(`(() => {
        const nodes = [document.scrollingElement, ...document.querySelectorAll(${JSON.stringify(selectors)})];
        return nodes.filter(n => n && getComputedStyle(n).display !== 'none' && n.scrollHeight > n.clientHeight + 1
          && (n === document.scrollingElement || /auto|scroll/.test(getComputedStyle(n).overflowY)))
          .map(n => (n.id || n.className || n.tagName) + ' ' + n.scrollHeight + '/' + n.clientHeight);
      })()`),
      async shot(name) {
        assert.ok(shots, 'openPage({ shots }) is needed for screenshots');
        const { data } = await send('Page.captureScreenshot', { format: 'png' });
        await writeFile(new URL(name, shots), Buffer.from(data, 'base64'));
        console.log(`shot ${name}`);
      },
      close: () => socket.close(),
    };
    return page;
  }

  async function close() {
    const exited = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill();
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 5 });
  }
  return { openPage, close };
}

// Seeds a story save, then opens the game as a guest. The seed runs on a plain page of the same
// origin, because the game itself saves its position when it unloads.
export async function startGame(page, story, player = { x: 3, y: 9 }) {
  const base = baseUrl();
  await page.goto(`${base}/story/`);
  await page.send('Storage.clearDataForOrigin', { origin: new URL(base).origin, storageTypes: 'all' });
  await page.evaluate(`localStorage.setItem('${STORY_KEY}', ${JSON.stringify(JSON.stringify({ story: JSON.stringify(story), progress: {} }))});
    localStorage.setItem('${WALK_KEY}', ${JSON.stringify(JSON.stringify({ player, steps: 0, doorOpen: story.safe.open }))});
    sessionStorage.clear();`);
  await page.goto(`${base}/`);
  await page.click('Play as guest');
  await page.click(story.missionRead ? 'Resume Game' : 'Start New Game');
  await wait(400);
}
