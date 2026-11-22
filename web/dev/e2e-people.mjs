// Browser check for the journal: "Case" and "People" tabs, unlocking, no scrolling.
// Run with a server in web/ (or use node web/dev/run-e2e.mjs). Screenshots: web/dev/shots/people/.
import { newGame, readMission, solveStation, tryOpenSafe } from '../story/engine.js';
import { STATION_IDS, CODEWORD } from '../story/case-1.js';
import { meet } from '../story/people.js';
import { launchBrowser, startGame, checker } from './cdp.mjs';

const shots = new URL('./shots/people/', import.meta.url);
const counter = checker();
const { check } = counter;
const browser = await launchBrowser();

const started = readMission(newGame()).state;
let all = meet(meet(started, 'leon'), 'imani');
for (const id of STATION_IDS) all = solveStation(all, id, {}).state;
const safeOpen = tryOpenSafe(all, CODEWORD).state;

for (const [width, height] of [[1440, 900], [1280, 720], [390, 844]]) {
  const size = `${width}x${height}`;
  const page = await browser.openPage({ shots });
  await page.viewport(width, height);

  // Before: nobody met yet.
  await startGame(page, started);
  await page.key('j');
  check((await page.scrolls()).filter(n => !n.startsWith('story-list ')).length === 0, `${size}: Case page needs no scrolling`);
  await page.click('People', '.journal-tabs');
  const before = await page.evaluate(`document.querySelector('#journal-people-page').innerText`);
  check((before.match(/Not met yet/g) ?? []).length === 4, `${size}: before anyone is met, all four show "Not met yet"`);
  check((await page.scrolls()).length === 0, `${size}: People page needs no scrolling`);
  await page.shot(`people-before-${size}.png`);

  // After: Leon and Imani met, safe open (Vale and Voss unlocked).
  await startGame(page, safeOpen, { x: 11, y: 6 });
  await page.key('j');
  await page.click('People', '.journal-tabs');
  const after = await page.evaluate(`document.querySelector('#journal-people-page').innerText`);
  check(/Leon/.test(after) && /Imani/.test(after) && /Dr\. Mara Vale/.test(after) && /Adrien Voss/.test(after) && !/Not met yet/.test(after), `${size}: all four unlocked`);
  check(!/suspect|guilty|Signed/i.test(after), `${size}: no spoilers before the accusation`);
  check(await page.evaluate(`[...document.querySelectorAll('canvas.journal-person-portrait')].every(c => c.getContext('2d').getImageData(0, 0, 64, 64).data.some(v => v))`), `${size}: portraits are drawn`);
  check((await page.scrolls()).length === 0, `${size}: People page needs no scrolling`);
  await page.shot(`people-after-${size}.png`);
  await page.click('Case', '.journal-tabs');
  check(await page.evaluate(`!document.querySelector('#journal-case-pages').hidden && document.querySelector('#journal-people-page').hidden`), `${size}: the Case tab comes back`);

  check(page.errors.length === 0, `${size}: console without errors ${page.errors.join(' | ')}`);
  page.close();
}
await browser.close();
console.log(`${counter.count} checks passed`);
