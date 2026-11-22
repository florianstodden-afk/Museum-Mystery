// Browser check for the final question: one accusation, confirmation, Case lost, new evidence texts.
// Drives Chrome/Edge over the DevTools protocol (web/dev/cdp.mjs); no Playwright needed.
// Run all browser checks with: node web/dev/run-e2e.mjs   (or start a server in web/ and set STORY_URL).
// Screenshots go to web/dev/shots/accusation/.
import { newGame, readMission, solveStation, tryOpenSafe } from '../story/engine.js';
import { STATION_IDS, CODEWORD } from '../story/case-1.js';
import { launchBrowser, checker, wait, baseUrl, STORY_KEY, WALK_KEY } from './cdp.mjs';

const base = baseUrl();
const shots = new URL('./shots/accusation/', import.meta.url);
const VIEWPORTS = [[1440, 900], [390, 844]];
const counter = checker();
const { check } = counter;
const browser = await launchBrowser();
const openPage = () => browser.openPage({ shots });

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
  check(/Paid for the new Gallery wing/.test(await page.dialogText()), `${size}: "Not yet" returns to the three names`);
  await page.click('Leon');
  await page.key('Escape');
  check(/Paid for the new Gallery wing/.test(await page.dialogText()), `${size}: Escape returns to the names and keeps the panel open`);
  const untouched = await page.story();
  check(untouched.accusation.attempts === 0 && untouched.ending === null && untouched.accusation.accused === null, `${size}: cancelling counts no accusation`);
  await page.click('Dr. Mara Vale');
  await page.click('Name her');
  const lost = await page.story();
  check(lost.ending === 'lost' && lost.accusation.accused === 'vale', `${size}: wrong name ends the case`);
  const lostText = await page.dialogText();
  check(/Case lost/.test(lostText) && /You named Dr\. Mara Vale\. By morning the word had reached Adrien Voss\./.test(lostText), `${size}: Case lost text names Vale and Voss`);
  check(/It was Adrien Voss, the patron\. The [“‘]V[”’] is not Vale/.test(lostText), `${size}: Case lost explains why Vale is innocent`);
  check(/Try again/.test(lostText) && /Back to menu/.test(lostText), `${size}: Try again and Back to menu`);
  check((await page.scrolls()).length === 0, `${size}: Case lost screen needs no scrolling`);
  await page.shot(`case-lost-${size}.png`);

  // Journal with the new evidence texts (all stations solved, before the final question).
  await startAt(page, allSolved(), { x: 11, y: 6 });
  await page.key('j');
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await page.evaluate("!document.querySelector('#sidebar').hidden")) break;
    await wait(50);
  }
  check(await page.evaluate("document.querySelector('#journal-title').getBoundingClientRect().bottom <= document.querySelector('.journal-book').getBoundingClientRect().top"), size + ': title sits above book');
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

await browser.close();
console.log(`${counter.count} checks passed`);
