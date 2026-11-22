// Browser check for the story dialogues: M, Leon before/after Station 1, Imani before/after Station 2, Vale at the safe.
// Drives Chrome/Edge over the DevTools protocol (web/dev/cdp.mjs); no Playwright needed.
// Run all browser checks with: node web/dev/run-e2e.mjs   (or start a server in web/ and set STORY_URL).
// Screenshots go to web/dev/shots/story-dialogues/.
import { newGame, readMission, solveStation, tryOpenSafe, addNote } from '../story/engine.js';
import { STATION_IDS, CODEWORD } from '../story/case-1.js';
import { launchBrowser, checker, wait, baseUrl, STORY_KEY, WALK_KEY } from './cdp.mjs';

const base = baseUrl();
const shots = new URL('./shots/story-dialogues/', import.meta.url);
const VIEWPORTS = [[1440, 900], [390, 844]];
const counter = checker();
const { check } = counter;
const browser = await launchBrowser();
const openPage = () => browser.openPage({ shots });

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

await browser.close();
console.log(`${counter.count} checks passed`);
