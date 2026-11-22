// Browser check for Station 1 (Portrait Hall) in the real game, with the Met API blocked (offline copies).
// Intro → Start ↵ → 4 s with the dates → one wrong check → sort with the number keys → success popup
// with letter I → art cards → back to the museum. No scrolling at 1440×900, 1280×720 and 390×844.
import { newGame, readMission } from '../story/engine.js';
import { launchBrowser, startGame, checker, wait } from './cdp.mjs';

const shots = new URL('./shots/station-1/', import.meta.url);
const counter = checker();
const { check } = counter;
const browser = await launchBrowser();
const started = readMission(newGame()).state;

for (const [width, height] of [[1440, 900], [1280, 720], [390, 844]]) {
  const size = `${width}x${height}`;
  const page = await browser.openPage({ shots, blockMet: true });
  await page.viewport(width, height);
  await startGame(page, started, { x: 4, y: 4 });
  await page.key('e');
  const noScroll = async label => check((await page.scrolls()).length === 0, `${size}: ${label} needs no scrolling`);
  check(/Points are given based on speed/.test(await page.dialogText()), `${size}: Station 1 intro`);
  check(await page.evaluate(`document.activeElement?.textContent.startsWith('Start')`), `${size}: Start has the focus`);
  await noScroll('intro');

  await page.key('Enter');                                           // Start ↵
  const years = await page.evaluate(`[...document.querySelectorAll('.portrait-chip')].map(n => n.textContent)`);
  check(years.length === 4, `${size}: the flash shows four dates (${years.join(', ')})`);
  await wait(4300);                                                  // 4 s reading time
  await page.key('Enter');                                           // still shuffled → wrong
  check(/Not yet/.test(await page.evaluate(`document.querySelector('.portrait-timeline [role=status]')?.textContent ?? ''`)), `${size}: a wrong check says "Not yet"`);
  await noScroll('after a mistake');

  // Sort oldest first with the number keys (selection sort over the remembered years).
  const order = years.map(text => parseInt(text, 10));
  for (let i = 0; i < order.length; i++) {
    let min = i;
    for (let j = i + 1; j < order.length; j++) if (order[j] < order[min]) min = j;
    if (min === i) continue;
    await page.key(String(i + 1));
    await page.key(String(min + 1));
    [order[i], order[min]] = [order[min], order[i]];
  }
  await page.key('Enter');
  const popup = await page.evaluate(`document.querySelector('#dialog .puzzle-popup')?.innerText ?? ''`);
  check(/I\s*added to journal/.test(popup) && /\+(15|10|5) points earned/.test(popup), `${size}: success popup with letter I`);
  await noScroll('success popup');
  await page.shot(`station-1-solved-${size}.png`);
  check(await page.evaluate(`[...document.querySelectorAll('.portrait-face img')].every(img => img.complete && img.naturalWidth > 0)`), `${size}: all four portraits load offline`);

  await page.key('a');                                               // Learn about the art
  const artists = [];
  for (let i = 0; i < 4; i++) { artists.push(await page.evaluate(`document.querySelector('.art-card-artist')?.textContent`)); await page.key('ArrowRight'); }
  check(new Set(artists).size === 4, `${size}: art cards show four works`);
  await noScroll('art card');
  await page.key('Escape');
  const story = await page.story();
  check(story.stations.portraits.solved && story.letters[1] === 'I', `${size}: back in the museum with letter I saved`);
  check(page.errors.length === 0, `${size}: console without errors ${page.errors.join(' | ')}`);
  page.close();
}
await browser.close();
console.log(`${counter.count} checks passed`);
