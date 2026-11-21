// Browser check for the final question: one accusation, confirmation, Case lost, new evidence texts.
// Needs no Playwright: it drives Google Chrome directly over the DevTools protocol (Node ≥ 22).
// Run with a web server in web/:  python3 -m http.server 8011
//   STORY_URL=http://127.0.0.1:8011 node web/dev/e2e-accusation.mjs
// CHROME_PATH can point at another Chrome/Chromium. Screenshots go to web/dev/shots/accusation/.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newGame, readMission, solveStation, tryOpenSafe } from '../story/engine.js';
import { STATION_IDS, CODEWORD } from '../story/case-1.js';

const base = process.env.STORY_URL ?? 'http://127.0.0.1:8011';
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const shots = new URL('./shots/accusation/', import.meta.url);
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
function allSolved() {
  let s = readMission(newGame()).state;
  for (const id of STATION_IDS) s = solveStation(s, id, {}).state;
  return s;
}
const atFinalQuestion = tryOpenSafe(allSolved(), CODEWORD).state;

// Opens the game as a guest with the given story save, standing next to the original painting.
async function startAt(page, story, player = { x: 22, y: 5 }) {
  // Seed from a plain page of the same origin: the game itself saves its position when it unloads.
  await page.goto(`${base}/story/`);
  await page.send('Storage.clearDataForOrigin', { origin: new URL(base).origin, storageTypes: 'all' });
  await page.evaluate(`localStorage.setItem('${STORY_KEY}', ${JSON.stringify(JSON.stringify({ story: JSON.stringify(story), progress: {} }))});
    localStorage.setItem('${WALK_KEY}', ${JSON.stringify(JSON.stringify({ player, steps: 0, doorOpen: story.safe.open }))});
    sessionStorage.clear();`);
  await page.goto(`${base}/`);
  await page.click('Play as guest');
  await page.click('Resume Game');
  await wait(300);
}

async function openFinalQuestion(page) {
  await page.key('e');
  const text = await page.dialogText();
  if (!/Who planned/.test(text)) {
    await page.shot('debug.png');
    console.log('DEBUG', JSON.stringify(text), await page.evaluate(`[localStorage.getItem('${WALK_KEY}'), document.activeElement?.id, document.querySelector('#home-screen').hidden]`));
  }
  check(/Who planned the false label/.test(text), 'E at the original opens the final question');
  check(!/Attempts left/.test(text), 'no "Attempts left" line');
}

for (const [width, height] of VIEWPORTS) {
  const size = `${width}x${height}`;
  const page = await openPage();
  await page.viewport(width, height);

  if (process.env.PROBE_JOURNAL) {
    await startAt(page, allSolved(), { x: 11, y: 6 });
    await page.key('j');
    console.log(size, await page.scrolls(), await page.evaluate(`[...document.querySelectorAll('.journal-page, .journal-pages')].map(n => n.className + ' ' + n.scrollHeight + '/' + n.clientHeight)`));
    await page.shot(`probe-journal-${size}.png`);
    page.close();
    continue;
  }

  // Run 1: right accusation + Steal.
  await startAt(page, atFinalQuestion);
  await openFinalQuestion(page);
  await page.click('Adrien Voss');
  check(/Name Adrien Voss\? You get one chance – once you speak, M will hear of it\./.test(await page.dialogText()), `${size}: confirmation for Voss`);
  await page.key('Enter');
  check((await page.story()).accusation.solved, `${size}: Enter confirms the right name`);
  check(/CHAIN OF EVIDENCE/.test(await page.dialogText()), `${size}: chain of evidence after the right name`);
  await page.click('Decide what happens');
  await page.click('Steal the artwork');
  check((await page.story()).ending === 'heist' && /I am a thief/.test(await page.dialogText()), `${size}: right accusation + Steal → heist`);

  // Run 2: right accusation + Quit (confirm by button).
  await startAt(page, atFinalQuestion);
  await openFinalQuestion(page);
  await page.click('Adrien Voss');
  await page.click('Name him');
  await page.click('Decide what happens');
  await page.click('Quit the mission');
  check((await page.story()).ending === 'open-file' && /I am not a thief/.test(await page.dialogText()), `${size}: right accusation + Quit → open-file`);

  // Run 3: cancel the confirmation (button and Escape), then name Vale → Case lost.
  await startAt(page, atFinalQuestion);
  await openFinalQuestion(page);
  await page.click('Dr. Mara Vale');
  const confirmText = await page.dialogText();
  check(/Name Dr\. Mara Vale\? You get one chance/.test(confirmText) && /Name her/.test(confirmText) && /Not yet/.test(confirmText), `${size}: confirmation names Vale with "Name her" / "Not yet"`);
  check((await page.scrolls()).length === 0, `${size}: confirmation needs no scrolling`);
  await page.shot(`confirm-${size}.png`);
  await page.click('Not yet');
  check(/Generous donor/.test(await page.dialogText()), `${size}: "Not yet" returns to the three names`);
  await page.click('Leon');
  await page.key('Escape');
  check(/Generous donor/.test(await page.dialogText()), `${size}: Escape returns to the names and keeps the panel open`);
  const untouched = await page.story();
  check(untouched.accusation.attempts === 0 && untouched.ending === null && untouched.accusation.accused === null, `${size}: cancelling counts no accusation`);
  await page.click('Dr. Mara Vale');
  await page.click('Name her');
  const lost = await page.story();
  check(lost.ending === 'lost' && lost.accusation.accused === 'vale', `${size}: wrong name ends the case`);
  const lostText = await page.dialogText();
  check(/Case lost/.test(lostText) && /You named Dr\. Mara Vale\. By morning the word had reached Adrien Voss\./.test(lostText), `${size}: Case lost text names Vale and Voss`);
  check(/It was Adrien Voss, the patron\. The “V” is not Vale/.test(lostText), `${size}: Case lost explains why Vale is innocent`);
  check(/Try again/.test(lostText) && /Back to menu/.test(lostText), `${size}: Try again and Back to menu`);
  check((await page.scrolls()).length === 0, `${size}: Case lost screen needs no scrolling`);
  await page.shot(`case-lost-${size}.png`);

  // Journal with the new evidence texts (all stations solved, before the final question).
  await startAt(page, allSolved(), { x: 11, y: 6 });
  await page.key('j');
  const journal = await page.evaluate(`document.querySelector('.journal-book')?.innerText ?? document.body.innerText`);
  check(/approved by a patron – not by museum staff/.test(journal) && /Ordered by: A\. V\./.test(journal), `${size}: journal shows the new evidence`);
  check(!/Voss/.test(journal), `${size}: journal names no Voss before the accusation`);
  check(/Bring it to me tonight|out tonight/.test(journal) || !/sunrise/.test(journal), `${size}: journal has no "before sunrise"`);
  check(!/sunrise/i.test(await page.evaluate('document.body.innerText')), `${size}: no "sunrise" on the page`);
  await page.shot(`journal-${size}.png`);
  const journalScrolls = await page.scrolls();
  // Desktop: everything fits. Phone: only the evidence list scrolls inside its box (as on main before this change).
  const allowed = width < 700 ? journalScrolls.filter(n => !n.startsWith('story-list ')) : journalScrolls;
  check(allowed.length === 0, `${size}: journal needs no page scrolling ${journalScrolls.join(', ')}`);
  check(await page.evaluate(`[...document.querySelectorAll('.journal-page')].every(n => n.scrollHeight <= n.clientHeight + 1)`), `${size}: journal pages do not overlap`);

  check(page.errors.length === 0, `${size}: console without errors ${page.errors.join(' | ')}`);
  page.close();
}

const exited = new Promise(resolve => chrome.once('exit', resolve));
chrome.kill();
await exited;
await rm(profile, { recursive: true, force: true, maxRetries: 5 });
console.log(`${checks} checks passed`);
