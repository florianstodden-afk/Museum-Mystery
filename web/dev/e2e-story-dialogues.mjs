// Browser check for the story dialogues: M, Leon before/after Station 1, Imani before/after Station 2, Vale at the safe.
// Needs no Playwright: it drives Google Chrome directly over the DevTools protocol (Node ≥ 22).
// Run with a web server in web/:  python3 -m http.server 8011
//   STORY_URL=http://127.0.0.1:8011 node web/dev/e2e-story-dialogues.mjs
// CHROME_PATH can point at another Chrome/Chromium. Screenshots go to web/dev/shots/story-dialogues/.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newGame, readMission, solveStation, tryOpenSafe } from '../story/engine.js';
import { STATION_IDS, CODEWORD } from '../story/case-1.js';
import { addNote } from '../story/engine.js';

const base = process.env.STORY_URL ?? 'http://127.0.0.1:8011';
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const shots = new URL('./shots/story-dialogues/', import.meta.url);
await mkdir(shots, { recursive: true });
const STORY_KEY = 'museum-nocturne-story-v1';
const WALK_KEY = 'museum-mystery-walk-v1';
const VIEWPORTS = [[1440, 900], [390, 844]];

let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; console.log(`PASS ${message}`); }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// ---------- a tiny DevTools client ----------
const profile = await mkdtemp(join(tmpdir(), 'nocturne-chrome-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const browserUrl = await new Promise((resolve, reject) => {
  let text = '';
  chrome.stderr.on('data', chunk => {
    text += chunk;
    const match = text.match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) resolve(match[1]);
  });
  chrome.on('exit', code => reject(Error(`Chrome exited (${code}): ${text}`)));
});
const port = new URL(browserUrl).port;

async function openPage() {
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
    } else if (message.method) for (const l of listeners) l(message);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const errors = [];
  listeners.push(({ method, params }) => {
    if (method === 'Runtime.exceptionThrown') errors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') errors.push(params.args.map(a => a.value ?? a.description).join(' '));
    if (method === 'Log.entryAdded' && params.entry.level === 'error' && !/metmuseum\.org|favicon\.ico/.test(params.entry.url ?? '')) errors.push(`${params.entry.text} ${params.entry.url ?? ''}`);
  });
  await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable'].map(m => send(m)));
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const KEYS = { Enter: 13, Escape: 27, e: 69, j: 74 };
  return {
    errors,
    send,
    evaluate,
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
      const code = KEYS[key];
      const text = key.length === 1 ? key : key === 'Enter' ? '\r' : undefined;
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, windowsVirtualKeyCode: code, text });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, windowsVirtualKeyCode: code });
      await wait(250);
    },
    // Clicks the first visible button whose text contains `label` (inside the open dialog if there is one).
    async click(label) {
      const done = await evaluate(`(() => {
        const visible = node => node.getClientRects().length && !node.closest('[hidden]');
        const dialog = document.querySelector('#dialog:not(.hidden)');
        const scope = dialog ?? document;
        const target = [...scope.querySelectorAll('button')].find(b => visible(b) && b.textContent.includes(${JSON.stringify(label)}));
        if (!target) return false;
        target.click();
        return true;
      })()`);
      assert.ok(done, `button "${label}" not found`);
      await wait(300);
    },
    dialogText: () => evaluate(`document.querySelector('#dialog:not(.hidden)')?.textContent ?? ''`),
    story: () => evaluate(`JSON.parse(JSON.parse(localStorage.getItem('${STORY_KEY}')).story)`),
    // True when the open dialog (or the page) needs scrolling to show everything.
    scrolls: () => evaluate(`(() => {
      const nodes = [document.scrollingElement, ...document.querySelectorAll('#dialog:not(.hidden), #dialog:not(.hidden) *, .journal-book, .journal-book *')];
      return nodes.filter(n => n && getComputedStyle(n).display !== 'none' && n.scrollHeight > n.clientHeight + 1
        && (n === document.scrollingElement || /auto|scroll/.test(getComputedStyle(n).overflowY)))
        .map(n => (n.id || n.className || n.tagName) + ' ' + n.scrollHeight + '/' + n.clientHeight);
    })()`),
    async shot(name) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(new URL(name, shots), Buffer.from(data, 'base64'));
      console.log(`shot ${name}`);
    },
    close: () => socket.close(),
  };
}

// ---------- seeded saves ----------
const fresh = newGame();
const started = readMission(newGame()).state;
const withNote = addNote(started, 'transport-cart').state;
const afterPortraits = solveStation(withNote, 'portraits', {}).state;
const afterPuzzle = solveStation(afterPortraits, 'restoration', {}).state;
let all = afterPuzzle;
for (const id of STATION_IDS) if (!all.stations[id].solved) all = solveStation(all, id, {}).state;
const safeOpen = tryOpenSafe(all, CODEWORD).state;

async function startAt(page, story, player) {
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

const rawSpeech = page => page.evaluate(`(() => { const s = document.querySelector('.speech:not(.hidden)'); return s ? s.querySelector('.speech-name').textContent + ': ' + s.querySelector('.speech-text').textContent : ''; })()`);

// The box types its text letter by letter: wait until it stops changing.
async function speechText(page) {
  let last = await rawSpeech(page);
  for (let i = 0; i < 40; i++) {
    await wait(150);
    const now = await rawSpeech(page);
    if (now === last) return now;
    last = now;
  }
  return last;
}

// Press E until the speech box of `name` opens (Leon walks around, so try a few spots).
async function talk(page, name, spots, story) {
  for (const spot of spots) {
    await startAt(page, story, spot);
    await page.key('e');
    await wait(500);
    if ((await speechText(page)).startsWith(name)) return;
  }
  throw Error(`could not talk to ${name}`);
}

// Reads every box of the greeting (E goes on), returns them all.
async function readBoxes(page, shotName, max = 6) {
  const boxes = [];
  for (let i = 0; i < max; i++) {
    const text = await speechText(page);
    if (!text || boxes.includes(text)) break;
    boxes.push(text);
    if (i === 0) await page.shot(shotName);
    await page.key('e');
    await wait(500);
  }
  return boxes.map(b => b.replace(/^[^:]+: /, ''));
}

const LEON_SPOTS = [{ x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 9 }, { x: 4, y: 7 }, { x: 6, y: 8 }, { x: 4, y: 9 }];
for (const [width, height] of VIEWPORTS) {
  const size = `${width}x${height}`;
  const page = await openPage();
  await page.viewport(width, height);

  // M: the mission on a new game, then the line while the safe is closed.
  await startAt(page, fresh, { x: 3, y: 9 });
  if (!/is a copy/.test(await page.dialogText())) await page.click('Start New Game').catch(() => {});
  await wait(300);
  const mission = await page.dialogText();
  check(/The Van Gogh in the Gallery is a copy\..*new conservation temp\..*Bring me the painting tonight\. – M/.test(mission), `${size}: M's message`);
  await page.shot(`m-mission-${size}.png`);
  await page.click('Accept the mission');
  await page.key('j');
  await page.click('Read M’s message');
  check(/Four stations, four letters\. Put them together and the safe is yours\./.test(await page.dialogText()), `${size}: M while the safe is closed`);
  await page.shot(`m-safe-closed-${size}.png`);

  // Leon before and after Station 1.
  await talk(page, 'Leon', LEON_SPOTS, started);
  check((await speechText(page)).includes('You must be the new conservation temp'), `${size}: Leon greets the new temp`);
  await page.shot(`leon-before-station1-${size}.png`);
  await talk(page, 'Leon', LEON_SPOTS, afterPortraits);
  await page.click('Rough night so far?');
  await wait(400);
  check((await speechText(page)).includes('East stairs at 21:14 – signed in the log'), `${size}: Leon after Station 1`);
  await page.shot(`leon-after-station1-${size}.png`);

  // Imani before and after Station 2.
  await talk(page, 'Imani', [{ x: 15, y: 11 }, { x: 14, y: 12 }, { x: 16, y: 12 }], started);
  const imaniBefore = await readBoxes(page, `imani-before-station2-${size}.png`);
  check(/varnish is still sticky/.test(imaniBefore.join(' ')) && /Renoir puzzle at Station 2/.test(imaniBefore.join(' ')), `${size}: Imani spots the fake`);
  await talk(page, 'Imani', [{ x: 15, y: 11 }, { x: 14, y: 12 }, { x: 16, y: 12 }], afterPuzzle);
  const imaniAfter = await readBoxes(page, `imani-after-station2-${size}.png`);
  check(/hidden ‘V’/.test(imaniAfter.join(' ')), `${size}: Imani after Station 2`);

  // Vale at the open safe.
  await talk(page, 'Dr. Mara Vale', [{ x: 21, y: 11 }, { x: 20, y: 12 }, { x: 22, y: 12 }, { x: 21, y: 10 }], safeOpen);
  const vale = await readBoxes(page, `vale-at-safe-${size}.png`);
  check(/never looked right to me/.test(vale.join(' ')) && /left empty/.test(vale.join(' ')), `${size}: Vale at the safe`);

  check(page.errors.length === 0, `${size}: console without errors ${page.errors.join(' | ')}`);
  page.close();
}

const exited = new Promise(resolve => chrome.once('exit', resolve));
chrome.kill();
await exited;
await rm(profile, { recursive: true, force: true, maxRetries: 5 });
console.log(`${checks} checks passed`);
