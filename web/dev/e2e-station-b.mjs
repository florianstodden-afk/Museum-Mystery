// Run with a web server: STATION_URL=http://127.0.0.1:8011 node web/dev/e2e-station-b.mjs
// Requires Playwright; PLAYWRIGHT_MODULE can point at an existing installation.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { newGame, readMission } from '../story/engine.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.STATION_URL ?? 'http://127.0.0.1:8000';
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const shots = new URL('../../docs/screenshots/', import.meta.url);
await mkdir(shots, { recursive: true });
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; console.log(`PASS ${message}`); }
async function tabTo(page, selector) {
  for (let n = 0; n < 30; n++) {
    if (await page.locator(selector).evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw Error(`Tab could not reach ${selector}`);
}
for (const app of ['main', 'preview']) for (const width of [1280, 390]) {
  const height = width === 390 ? 844 : 720;
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390 });
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  // The entire station plays from bundled copies even when external Met resources fail.
  await page.route(/https:\/\/(collectionapi|images)\.metmuseum\.org\//, route => route.abort());
  const key = app === 'main' ? 'museum-nocturne-story-v1' : 'museum-nocturne-story-preview-v1';
  await context.addInitScript(({ key, story }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ story, progress: {} }));
    if (!localStorage.getItem('museum-mystery-walk-v1')) localStorage.setItem('museum-mystery-walk-v1', JSON.stringify({ player: { x: 14, y: 4 }, steps: 0, doorOpen: false }));
  }, { key, story: JSON.stringify(readMission(newGame()).state) });
  await page.goto(`${base}/${app === 'preview' ? 'dev/story.html' : ''}`, { waitUntil: 'domcontentloaded' });
  const enter = async () => {
    if (app === 'main') await page.keyboard.press('e');
    else await page.getByRole('button', { name: 'Enter station', exact: true }).first().click();
  };
  if (app === 'main') {
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await page.getByRole('button', { name: 'Continue as guest' }).click();
    await page.getByRole('button', { name: 'Resume Game', exact: true }).click();
  }
  await enter(); await page.getByRole('button', { name: /^Start/ }).waitFor();
  const progress = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)).progress.landscape, key);
  const story = () => page.evaluate(key => JSON.parse(JSON.parse(localStorage.getItem(key)).story), key);
  const tag = `${app} ${width}`;
  check((await progress()).startedAt === null, `${tag}: opening is untimed`);
  check(await page.getByRole('button', { name: /Back to.*museum/ }).count() === 1, `${tag}: one back button`);
  check(await page.locator('.catalogue-artwork').count() === 0, `${tag}: no board before Start`);
  await page.getByRole('button', { name: 'Curator’s Catalogue instructions' }).click();
  check(await page.locator('.catalogue-puzzle .puzzle-popup').isVisible(), `${tag}: instructions popup`);
  await page.keyboard.press('Escape');
  check((await progress()).startedAt === null, `${tag}: help does not start time`);
  await page.getByRole('button', { name: /^Start/ }).click();
  check(await page.locator('.catalogue-artwork img').evaluateAll(list => list.length === 4 && list.every(img => img.complete && img.naturalWidth > 0)), `${tag}: all four offline images decoded`);
  const board = await page.locator('.catalogue-board').boundingBox();
  const tray = await page.locator('.catalogue-labels').boundingBox();
  check(width === 390 ? tray.y >= board.y + board.height : tray.x >= board.x + board.width, `${tag}: tray positioned correctly`);
  check(await page.locator('.catalogue-board').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length === 2), `${tag}: two artwork columns`);
  check(await page.locator('.catalogue-puzzle').evaluate(el => el.scrollWidth <= el.clientWidth), `${tag}: no horizontal overflow`);
  await page.screenshot({ path: fileURLToPath(new URL(`station-b-${app}-${width}-board.png`, shots)) });
  const slot = id => page.locator(`[data-slot="${id}"]`);
  const card = id => page.locator(`.catalogue-tray [data-label="${id}"]`);
  check((await slot(0).boundingBox()).width > (await page.locator('.catalogue-artwork').first().boundingBox()).width - 22, `${tag}: label slot fills the frame width`);
  check(await page.locator('.puzzle-drag-demo').isVisible(), `${tag}: animated drag guide`);
  check(await page.getByRole('button', { name: 'Return selected label to tray' }).count() === 0, `${tag}: no return button`);
  check(await page.locator('.catalogue-artwork').evaluateAll(nodes => nodes.every(node => node.tagName === 'FIGURE')), `${tag}: art itself is not selectable`);
  if (width === 390) { await card(0).tap(); await slot(2).tap(); }
  else await card(0).dragTo(slot(2));
  check((await progress()).slots[2] === 0, `${tag}: initial pointer placement`);
  check(await page.locator('.puzzle-drag-demo').isHidden(), `${tag}: guide dismissed on interaction`);
  await card(1).click(); await slot(3).click();
  await slot(2).dragTo(slot(3));
  check(JSON.stringify((await progress()).slots) === '[null,null,1,0]', `${tag}: incorrect labels swap by drag`);
  const emptyIndex = (await progress()).order.indexOf(1);
  if (width === 390) { await slot(3).tap(); await page.locator(`[data-tray="${emptyIndex}"]`).tap(); }
  else { await slot(3).click(); await page.locator(`[data-tray="${emptyIndex}"]`).click(); }
  check((await progress()).slots[3] === null && (await progress()).order[emptyIndex] === 0, `${tag}: return to chosen tray space`);
  await slot(2).click(); await slot(1).click();
  check(await slot(1).isDisabled() && (await slot(1).getAttribute('class')).includes('is-correct'), `${tag}: correct label glows and locks`);
  check(await slot(1).evaluate(el => getComputedStyle(el).boxShadow !== 'none'), `${tag}: correct slot has a visible glow`);
  const saved = await progress();
  await page.keyboard.press('Escape'); await enter(); await slot(0).waitFor();
  check(JSON.stringify(await progress()) === JSON.stringify(saved), `${tag}: close/reopen preserves matches and start time`);
  // Use only Tab and native Enter/Space activation to finish; do not focus via script.
  for (const id of [0, 2, 3]) {
    await tabTo(page, `.catalogue-tray [data-label="${id}"]`);
    await page.keyboard.press(id === 2 ? 'Space' : 'Enter');
    check(await card(id).getAttribute('aria-pressed') === 'true', `${tag}: keyboard selection ${id}`);
    await tabTo(page, `[data-slot="${id}"]`);
    await page.keyboard.press(id === 2 ? 'Enter' : 'Space');
  }
  await page.locator('.catalogue-puzzle .puzzle-popup').waitFor();
  const final = await progress(); const awarded = await story();
  check(final.solved && final.slots.every((id, i) => id === i), `${tag}: keyboard completes all four`);
  check(awarded.letters[0] === 'B' && awarded.evidence.filter(id => id === 'false-label').length === 1, `${tag}: one letter and clue`);
  const elapsed = final.finishedAt - final.startedAt;
  const points = elapsed <= 30000 ? 15 : elapsed <= 45000 ? 10 : elapsed <= 60000 ? 5 : 0;
  check(awarded.stations.landscape.points === points, `${tag}: exact saved speed reward`);
  check((await page.locator('.catalogue-puzzle .puzzle-popup').innerText()).includes('Voss approved the false wall label.'), `${tag}: original story clue`);
  await page.screenshot({ path: fileURLToPath(new URL(`station-b-${app}-${width}-solved.png`, shots)) });
  await page.keyboard.press('Enter');
  if (app === 'main') await enter();
  else await page.getByRole('button', { name: 'Solved · B', exact: true }).click();
  check((await page.locator(app === 'main' ? '#dialog-body' : '#modal-body').innerText()).includes('Already solved'), `${tag}: completed station is not replayed`);
  check((await story()).stations.landscape.points === points, `${tag}: no duplicate reward`);
  check(errors.length === 0, `${tag}: no uncaught browser errors`);
  await context.close();
}
// Exercise a genuine failed image request, not a mocked ready state.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); page.setDefaultTimeout(10000);
  const key = 'museum-nocturne-story-preview-v1';
  await context.addInitScript(({ key, story }) => localStorage.setItem(key, JSON.stringify({ story, progress: {} })), { key, story: JSON.stringify(readMission(newGame()).state) });
  await page.route('**/assets/catalogue/met-9485.jpg', route => route.abort());
  await page.route('https://images.metmuseum.org/**', route => route.abort());
  await page.goto(`${base}/dev/story.html`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Enter station', exact: true }).first().click();
  await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
  check(await page.getByRole('button', { name: /^Start/ }).count() === 0, 'failed image blocks Start in browser');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
  check(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).progress.landscape.startedAt === null, key), 'Enter cannot start failed art set');
  await page.unroute('**/assets/catalogue/met-9485.jpg');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByRole('button', { name: /^Start/ }).waitFor();
  check(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).progress.landscape.startedAt === null, key), 'successful browser retry remains untimed');
  await context.close();
}
await browser.close();
console.log(`${checks} browser checks passed`);
