// Browser check for Station 3 (Curator's Catalogue) in the real game, with the Met API blocked.
// Intro without a running clock → Start → place all four labels (click label, then slot) →
// success popup with the clue → letter O saved; reopening does not replay or reward twice.
import { newGame, readMission } from '../story/engine.js';
import { CASE } from '../story/case-1.js';
import { launchBrowser, startGame, checker, wait } from './cdp.mjs';

const shots = new URL('./shots/station-3/', import.meta.url);
const counter = checker();
const { check } = counter;
const browser = await launchBrowser();
const started = readMission(newGame()).state;
const clue = CASE.stations.find(s => s.id === 'landscape').evidence;

for (const [width, height] of [[1440, 900], [1280, 720], [390, 844]]) {
  const size = `${width}x${height}`;
  const page = await browser.openPage({ shots, blockMet: true });
  await page.viewport(width, height);
  await startGame(page, started, { x: 14, y: 4 });
  await page.key('e');
  const progress = () => page.evaluate(`JSON.parse(localStorage.getItem('museum-nocturne-story-v1')).progress.landscape ?? null`);
  check(/Curator|catalogue/i.test(await page.dialogText()), `${size}: Station 3 opens`);
  check((await progress())?.startedAt == null, `${size}: opening does not start the clock`);
  check(await page.evaluate(`document.querySelectorAll('.catalogue-artwork').length`) === 0, `${size}: no board before Start`);

  await page.click('Start');
  await wait(800);
  check(await page.evaluate(`(() => { const imgs = [...document.querySelectorAll('.catalogue-artwork img')]; return imgs.length === 4 && imgs.every(i => i.complete && i.naturalWidth > 0); })()`), `${size}: all four images load offline`);
  check(await page.evaluate(`(() => { const p = document.querySelector('.catalogue-puzzle'); return p.scrollWidth <= p.clientWidth; })()`), `${size}: no horizontal overflow`);
  await page.shot(`station-3-board-${size}.png`);

  for (let id = 0; id < 4; id++) {
    await page.evaluate(`document.querySelector('.catalogue-tray [data-label="${id}"]').click()`);
    await wait(120);
    await page.evaluate(`document.querySelector('[data-slot="${id}"]').click()`);
    await wait(200);
  }
  await wait(400);
  const popup = await page.evaluate(`document.querySelector('.catalogue-puzzle .puzzle-popup')?.innerText ?? ''`);
  check(popup.includes(clue), `${size}: the popup shows the clue`);
  check(!/Voss/.test(popup), `${size}: the clue does not name Voss`);
  check((await page.scrolls()).length === 0, `${size}: success popup needs no scrolling`);
  await page.shot(`station-3-solved-${size}.png`);
  const story = await page.story();
  check(story.letters[0] === 'O' && story.evidence.filter(id => id === 'false-label').length === 1, `${size}: letter O and one clue saved`);
  const points = story.stations.landscape.points;

  await page.key('Enter');                                           // Return to museum
  await page.key('e');
  check(/Already solved/.test(await page.dialogText()), `${size}: a solved station is not replayed`);
  check((await page.story()).stations.landscape.points === points, `${size}: no second reward`);
  check(page.errors.length === 0, `${size}: console without errors ${page.errors.join(' | ')}`);
  page.close();
}
await browser.close();
console.log(`${counter.count} checks passed`);
