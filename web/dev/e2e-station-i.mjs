// End-to-end check for Station I (Portrait Hall) in a real browser.
//
// Needs Playwright (not part of the project, nothing to build):
//   npm i -D playwright && npx playwright install chromium
//   python3 -m http.server 8000 --directory web     (in a second terminal)
//   node web/dev/e2e-station-i.mjs
//
// It opens the story preview, solves Station I once with one wrong check, and checks:
// letter I in the journal, points by time, no scrolling at 1280×720, 1440×900 and 390×844,
// no console errors, and that all three images show when the Met API is blocked (offline copies).
import { chromium } from 'playwright';

const URL = process.env.STATION_URL ?? 'http://localhost:8000/dev/story.html';
const SIZES = [[1280, 720], [1440, 900], [390, 844]];
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? '✔' : '✖'} ${name} ${detail}`); };

const browser = await chromium.launch();
for (const [width, height] of SIZES) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://collectionapi.metmuseum.org/**', route => route.abort()); // offline Met API
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Read M’s message' }).click();
  await page.getByRole('button', { name: 'Accept the mission' }).click();
  await page.getByRole('button', { name: 'Enter station' }).nth(1).click();

  const fits = () => page.evaluate(() => { const d = document.querySelector('dialog[open]'); return [d.scrollHeight, d.clientHeight]; });
  const report = async label => { const [s, c] = await fits(); ok(`${width}×${height} ${label}: no scrolling`, s <= c, `${s}/${c}`); };
  await report('start');

  const started = Date.now();
  await page.keyboard.press('Enter');                       // focus starts on Start
  const years = await page.locator('.portrait-chip').allTextContents();
  await report('flash');
  await page.waitForTimeout(3100);                          // dates vanish
  await page.getByRole('button', { name: /Check order/ }).click(); // still shuffled → wrong, +5 s
  ok(`${width}×${height} wrong check says "Not yet"`, (await page.locator('.portrait-status').textContent()).includes('Not yet'));
  await report('after a mistake');

  // Sort with the number keys by the remembered years (selection sort).
  const order = years.map(text => parseInt(text, 10));
  for (let i = 0; i < 3; i++) {
    let min = i;
    for (let j = i + 1; j < 3; j++) if (order[j] < order[min]) min = j;
    if (min === i) continue;
    await page.keyboard.press(String(i + 1));
    await page.keyboard.press(String(min + 1));
    [order[i], order[min]] = [order[min], order[i]];
  }
  await page.keyboard.press('Enter');
  const status = await page.locator('.portrait-status').textContent();
  ok(`${width}×${height} solved`, /Solved in 0:\d\d · \+(15|10)/.test(status), `${status} (wall clock ${((Date.now() - started) / 1000).toFixed(1)} s)`);
  await report('solved');

  const images = await page.locator('.portrait-face img').evaluateAll(list => list.map(img => img.complete && img.naturalWidth > 0));
  ok(`${width}×${height} offline images`, images.length === 3 && images.every(Boolean));
  await page.getByRole('button', { name: 'Continue' }).click();
  ok(`${width}×${height} letter I in the journal`, (await page.locator('body').innerText()).includes('Score: 15 / 90') || (await page.locator('body').innerText()).includes('Score: 10 / 90'));
  ok(`${width}×${height} no console errors`, errors.length === 0, errors.join(' | '));
  await page.close();
}
await browser.close();
const failed = results.filter(r => !r.pass).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
