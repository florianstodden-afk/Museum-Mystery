// End-to-end check for Station I (Portrait Hall) in a real browser.
//
// Needs Playwright (not part of the project, nothing to build):
//   npm i -D playwright && npx playwright install chromium
//   python3 -m http.server 8000 --directory web     (in a second terminal)
//   node web/dev/e2e-station-i.mjs
//
// It plays the flow of Station I (same as Station L): intro → Start ↵ → catalogue flash → sorting with the
// points bar (one wrong check) → success popup with letter I → Return to museum. It checks: no scrolling at
// 1280×720, 1440×900 and 390×844, the drag hint arrow, points by time, letter I in the journal,
// no console errors, and that all four images show when the Met API is blocked (offline copies).
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
  // Feedback: Start has the focus right away, so Enter starts the game (not the "?" help).
  ok(`${width}×${height} focus on Start`, await page.evaluate(() => document.activeElement?.textContent.startsWith('Start')));

  const fits = () => page.evaluate(() => { const d = document.querySelector('dialog[open]'); return [d.scrollHeight, d.clientHeight]; });
  const report = async label => { const [s, c] = await fits(); ok(`${width}×${height} ${label}: no scrolling`, s <= c, `${s}/${c}`); };

  // Intro like L: task, gold speed line, "?", Start ↵, Back to museum Esc – no cards yet.
  ok(`${width}×${height} intro`, await page.getByText('Points are given based on speed').isVisible() && (await page.locator('.portrait-face').count()) === 0);
  await report('intro');

  const started = Date.now();
  await page.keyboard.press('Enter');                                   // Start ↵
  const years = await page.locator('.portrait-chip').allTextContents();
  ok(`${width}×${height} flash shows four dates`, years.length === 4, years.join(', '));
  await report('flash');
  await page.waitForTimeout(10100);                                     // 10 s reading time, then the arrow appears
  ok(`${width}×${height} drag hint arrow`, await page.locator('.portrait-timeline .puzzle-drag-demo').isVisible());
  await page.keyboard.press('Enter');                                   // still shuffled → wrong, +5 s
  ok(`${width}×${height} wrong check says "Not yet"`, (await page.locator('.puzzle-status').textContent()).includes('Not yet'));
  await report('after a mistake');

  // Sort with the number keys by the remembered years (selection sort).
  const order = years.map(text => parseInt(text, 10));
  for (let i = 0; i < order.length; i++) {
    let min = i;
    for (let j = i + 1; j < order.length; j++) if (order[j] < order[min]) min = j;
    if (min === i) continue;
    await page.keyboard.press(String(i + 1));
    await page.keyboard.press(String(min + 1));
    [order[i], order[min]] = [order[min], order[i]];
  }
  await page.keyboard.press('Enter');
  const popup = await page.locator('.puzzle-popup').innerText();
  ok(`${width}×${height} success popup`, /I\s*added to journal/.test(popup) && /\+(15|10) points earned/.test(popup), `${popup.replace(/\s+/g, ' ')} (wall clock ${((Date.now() - started) / 1000).toFixed(1)} s)`);
  await report('solved');

  const images = await page.locator('.portrait-face img').evaluateAll(list => list.map(img => img.complete && img.naturalWidth > 0));
  ok(`${width}×${height} offline images`, images.length === 4 && images.every(Boolean));
  await page.keyboard.press('Enter');                                   // Return to museum ↵
  const body = await page.locator('body').innerText();
  ok(`${width}×${height} back in the museum with letter I`, !(await page.locator('dialog[open]').count()) && /Score: (15|10) \/ 90/.test(body));
  ok(`${width}×${height} no console errors`, errors.length === 0, errors.join(' | '));
  await page.close();
}
await browser.close();
const failed = results.filter(r => !r.pass).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
