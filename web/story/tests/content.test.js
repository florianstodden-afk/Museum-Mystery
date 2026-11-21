import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, addNote, tryOpenSafe, accuse, chooseEnding } from '../engine.js';
import { dialogueFor, renderDialogue, conversationFor } from '../dialogues.js';
import { journalModel, renderJournal, evidenceChain } from '../journal.js';
import { endingModel, renderEnding } from '../endings.js';
import { renderSafe } from '../safe-ui.js';
import { renderAccusation } from '../accusation-ui.js';
import { installFakeDom, createContainer, findAll, findButton } from './fake-dom.js';

const ALL = ['landscape', 'portraits', 'restoration', 'archive'];

function started() {
  return readMission(newGame()).state;
}

function finished(endingId, { wrongWord = false, wrongSuspect = null, stationResult = {} } = {}) {
  let s = started();
  for (const id of ALL) s = solveStation(s, id, stationResult[id] ?? {}).state;
  if (wrongWord) s = tryOpenSafe(s, 'OLIS').state;
  s = tryOpenSafe(s, 'OILS').state;
  if (wrongSuspect) s = accuse(s, wrongSuspect).state;
  s = accuse(s, 'voss').state;
  return chooseEnding(s, endingId).state;
}

test('M starts with the mission message', () => {
  const m = dialogueFor('m', newGame());
  assert.match(m.lines[0], /Wheat Field with Cypresses/);
  assert.equal(dialogueFor('nobody', newGame()), null);
});

test('Leon changes his story after the Portrait Hall', () => {
  let s = started();
  const before = dialogueFor('leon', s);
  assert.deepEqual(before.lines, [
    'At 21:14 a covered transport cart left the delivery exit.',
    'Nobody told me about a delivery. I couldn’t see what was on it.',
    'The monitors in the security office recorded it.',
  ]);
  s = addNote(s, 'transport-cart').state;
  assert.deepEqual(dialogueFor('leon', s).lines, [
    'I know – the guard always looks guilty first.',
    'The night-shift log hangs in the Portrait Hall. It shows where I was at 21:14.',
  ]);
  s = solveStation(s, 'portraits', {}).state;
  assert.deepEqual(dialogueFor('leon', s).lines, [
    'East stairs at 21:14 – signed in the log. I couldn’t have moved that cart.',
    'And it was booked as a ‘patron visit’. Guards can’t book visits.',
  ]);
  // An honest guard: no missing painting, no alarm, no camera whispering.
  for (const state of [started(), s]) assert.doesNotMatch(dialogueFor('leon', state).lines.join(' '), /missing|alarm|cameras/);
});

test('Imani spots the fake, points to Station 2 and reacts to its hidden mark', () => {
  let s = started();
  const before = dialogueFor('imani', s).lines.join(' ');
  assert.match(before, /Van Gogh in the Gallery\? The varnish is still sticky/);
  assert.match(before, /haven’t told anyone yet/);
  assert.match(before, /Renoir puzzle at Station 2/);
  s = solveStation(s, 'restoration', {}).state;
  assert.deepEqual(dialogueFor('imani', s).lines, [
    'Under my lamp the slip shows a hidden ‘V’. Whoever booked that cart marked it.',
    'But one letter can fit more than one person in this museum.',
  ]);
  for (const id of ALL) if (!s.stations[id].solved) s = solveStation(s, id, {}).state;
  s = tryOpenSafe(s, 'OILS').state;
  assert.deepEqual(dialogueFor('imani', s).lines, ['The original was in the safe? Then Dr. Vale had doubts too.']);
  assert.equal(conversationFor('imani', s).autoCloseAfterGreeting, true);
});

test('Dr. Vale only talks once the safe is open', () => {
  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  assert.equal(dialogueFor('vale', s).available, false);
  s = tryOpenSafe(s, 'OILS').state;
  assert.equal(dialogueFor('vale', s).available, true);
  assert.deepEqual(dialogueFor('vale', s).lines, [
    'You opened it. That new wall label in the Gallery never looked right to me – so I locked the original in here, just in case.',
    'The cart at 21:14 came for it and left empty.',
    'Someone needed my clues to get in. So – who sent you, and who is behind this?',
  ]);
  s = accuse(s, 'voss').state;
  assert.equal(dialogueFor('vale', s).lines[0], 'Voss. That label had his taste all over it – but I needed proof that wasn’t mine.');
  assert.match(dialogueFor('vale', s).lines.join(' '), /mécène/);
  assert.match(dialogueFor('vale', s).lines.join(' '), /choice is yours/);
});

test('journal lists slots by station number and shows a letter only after solving', () => {
  let s = started();
  s = solveStation(s, 'restoration', {}).state;
  s = solveStation(s, 'landscape', {}).state;
  const model = journalModel(s);
  assert.deepEqual(model.slots.map(slot => slot.number), [1, 2, 3, 4]);
  assert.deepEqual(model.slots.map(slot => slot.letter), ['?', 'L', 'O', '?'], 'Portraits, Puzzle, Catalogue, Forgery');
  assert.deepEqual(model.evidence.map(item => item.id), ['hidden-mark', 'false-label']);
  assert.equal(model.score.total, 30);
  assert.match(model.nextStep, /Portrait Hall; Gallery, frame rack\./);
});

test('journal renders slots, evidence and notes', () => {
  installFakeDom();
  let s = addNote(solveStation(started(), 'archive', {}).state, 'duty-roster').state;
  const container = createContainer();
  renderJournal(container, journalModel(s));
  const text = container.textContent;
  assert.match(text, /Frame label: “Ordered by: A\. V\.”/);
  assert.doesNotMatch(text, /Voss/);
  assert.match(text, /Shift schedule/);
  const slots = findAll(container, node => node.tagName === 'LI' && node.className.startsWith('story-slot'));
  assert.deepEqual(slots.map(slot => slot.textContent.charAt(0)), ['?', '?', '?', 'S']);
  assert.doesNotMatch(slots.slice(0, 3).map(slot => slot.textContent).join(' '), /Station [OILS]\b|\b[OILS] ·/);
});

test('evidence chain marks what has been found', () => {
  const s = solveStation(started(), 'portraits', {}).state;
  assert.deepEqual(evidenceChain(s).map(link => link.found), [false, true, false, false]);
});

test('ending model has no ending before the decision', () => {
  assert.equal(endingModel(started()), null);
});

test('ending model gives the right breakdown for both endings', () => {
  const heist = endingModel(finished('heist', { wrongWord: true, stationResult: { landscape: { mistakes: 1, hints: 1 } } }));
  assert.equal(heist.title, 'I am a thief');
  assert.match(heist.paragraphs.join(' '), /not for Voss, for yourself/);
  // Station I is a speedrun station now: at most 15 points (like L).
  assert.deepEqual(heist.breakdown.map(row => row.points), [15, 15, 15, 15, 5, 10]);
  assert.equal(heist.total, 75);
  assert.match(heist.image.src, /assets\/met-436535\.jpg$/);
  assert.match(heist.disclaimer, /Fictional museum and characters/);

  const openFile = endingModel(finished('open-file'));
  assert.equal(openFile.title, 'I am not a thief');
  assert.match(openFile.paragraphs.join(' '), /evidence exposes Voss/);
  assert.equal(openFile.total, 80);
  assert.equal(openFile.chain.every(link => link.found), true);
});

test('ending offers home and a new game while keeping score details', () => {
  installFakeDom();
  const container = createContainer();
  let restarted = false, wentHome = false;
  renderEnding(container, endingModel(finished('open-file')), { onNewGame: () => { restarted = true; }, onHome: () => { wentHome = true; } });
  assert.match(container.textContent, /80 \/ 80/);
  assert.match(container.textContent, /Dr\. Vale/);
  assert.equal(findAll(container, node => node.tagName === 'IMG').length, 1);
  findButton(container, 'Back to home').click();
  assert.equal(wentHome, true);
  findButton(container, 'New game').click();
  assert.equal(restarted, true);
});

test('safe UI offers code entry and explains missing proofs', () => {
  installFakeDom();
  const container = createContainer();
  renderSafe(container, { state: started() }, () => {});
  assert.equal(findAll(container, node => node.tagName === 'INPUT').length, 1);
  assert.match(container.textContent, /Collect proof from all four stations/);
  assert.match(container.textContent, /0 \/ 4/);

  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  let tried;
  renderSafe(container, { state: s }, word => { tried = word; });
  const [input] = findAll(container, node => node.tagName === 'INPUT');
  const [form] = findAll(container, node => node.tagName === 'FORM');
  input.value = 'oils';
  form.dispatch('submit');
  assert.equal(tried, 'oils');
});

test('accusation UI offers three suspects and reports the choice', () => {
  installFakeDom();
  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  s = tryOpenSafe(s, 'OILS').state;
  const container = createContainer();
  let chosen;
  renderAccusation(container, { state: s }, id => { chosen = id; });
  const choices = findAll(container, node => node.tagName === 'BUTTON');
  assert.equal(choices.length, 3);
  findButton(container, 'Adrien Voss').click();
  assert.equal(chosen, undefined, 'a click alone is not yet an accusation');
  assert.match(container.textContent, /Name Adrien Voss\? You get one chance/);
  findButton(container, 'Name him').click();
  assert.equal(chosen, 'voss');
});

test('dialogue renders every line', () => {
  installFakeDom();
  const container = createContainer();
  renderDialogue(container, dialogueFor('vale', newGame()));
  assert.match(container.textContent, /office is dark/);
  assert.equal(findAll(container, node => node.className === 'story-dialogue-line').length, 2);
});

test('the chain of evidence stays hidden until the right answer', () => {
  installFakeDom();
  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  s = tryOpenSafe(s, 'OILS').state;
  const container = createContainer();
  renderAccusation(container, { state: s }, () => {});
  assert.doesNotMatch(container.textContent, /CHAIN OF EVIDENCE/);
  renderAccusation(container, { state: accuse(s, 'leon').state, message: 'Not Leon.' }, () => {});
  assert.doesNotMatch(container.textContent, /CHAIN OF EVIDENCE/);
  renderAccusation(container, { state: accuse(s, 'voss').state }, () => {});
  assert.match(container.textContent, /CHAIN OF EVIDENCE/);
});

test('vault wheel selects letters, wraps around, and removes mistakes', () => {
  installFakeDom();
  const container=createContainer();let submitted;
  renderSafe(container,{state:started()},word=>{submitted=word;});
  const hub=findAll(container,node=>node.className==='vault-wheel-hub')[0];
  const dial=findAll(container,node=>node.className==='vault-wheel')[0];
  const input=findAll(container,node=>node.tagName==='INPUT')[0];
  const turn=key=>dial.dispatch('keydown',{key});
  turn('ArrowLeft');hub.click();assert.equal(input.value,'Z');
  findButton(container,'Remove last letter').click();
  for(let i=0;i<15;i++)turn('ArrowRight');hub.click();
  for(let i=0;i<6;i++)turn('ArrowLeft');hub.click();
  for(let i=0;i<3;i++)turn('ArrowRight');hub.click();
  for(let i=0;i<7;i++)turn('ArrowRight');hub.click();
  assert.equal(input.value,'OILS');
  findAll(container,node=>node.tagName==='FORM')[0].dispatch('submit');
  assert.equal(submitted,'OILS');
});

test('dragging the wheel rotates the selected letter and snaps on release', () => {
  installFakeDom();
  const container=createContainer();
  renderSafe(container,{state:started()},()=>{});
  const dial=findAll(container,node=>node.className==='vault-wheel')[0];
  const hub=findAll(container,node=>node.className==='vault-wheel-hub')[0];
  const input=findAll(container,node=>node.tagName==='INPUT')[0];
  dial.getBoundingClientRect=()=>({left:0,top:0,width:200,height:200});
  dial.dispatch('pointerdown',{target:dial,pointerId:1,button:0,clientX:100,clientY:10});
  dial.dispatch('pointermove',{target:dial,pointerId:1,clientX:78,clientY:13});
  dial.dispatch('pointerup',{target:dial,pointerId:1});
  hub.click();
  assert.equal(input.value,'B');
});

test('vault wheel uses distinct clicks for turning, a correct letter, and a different letter', () => {
  installFakeDom();
  const container=createContainer(), sounds=[];
  renderSafe(container,{state:started(),playSound:id=>sounds.push(id)},()=>{});
  const dial=findAll(container,node=>node.className==='vault-wheel')[0];
  const hub=findAll(container,node=>node.className==='vault-wheel-hub')[0];
  hub.click(); // A is not the first letter.
  assert.equal(sounds.at(-1),'vault-set');
  findButton(container,'Remove last letter').click();
  for(let i=0;i<14;i++)dial.dispatch('keydown',{key:'ArrowRight'}); // O
  assert.equal(sounds.at(-1),'vault-tick');
  hub.click();
  assert.equal(sounds.at(-1),'vault-correct');
});

test('journal reveals "Who was M?" only after the right accusation', () => {
  installFakeDom();
  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  s = tryOpenSafe(s, 'OILS').state;
  const before = createContainer();
  renderJournal(before, journalModel(s));
  assert.doesNotMatch(before.textContent, /Who was M|mécène/);
  const lostJournal = createContainer();
  renderJournal(lostJournal, journalModel(accuse(s, 'vale').state));
  assert.doesNotMatch(lostJournal.textContent, /Who was M|mécène/);
  s = accuse(s, 'voss').state;
  const after = createContainer();
  renderJournal(after, journalModel(s));
  assert.match(after.textContent, /Case notes · Who was M\?: M was Adrien Voss\..*mécène.*Mara Vale/);
  const words = journalModel(s).caseNotes[0].text.split(/\s+/).length;
  assert.ok(words <= 40, `${words} words`);
});

test('the choice explains why stealing is still possible, and every ending text stays short', async () => {
  const { CHOICE_TEXT, ENDINGS, renderEndingChoice } = await import('../endings.js');
  installFakeDom();
  const box = createContainer();
  renderEndingChoice(box, () => {});
  assert.match(box.textContent, /used you as his thief/);
  assert.ok(CHOICE_TEXT.split(/\s+/).length <= 45);
  for (const ending of Object.values(ENDINGS)) assert.ok(ending.paragraphs.join(' ').split(/\s+/).length <= 40, ending.title);
  assert.deepEqual(ENDINGS.lost.paragraphs, [], 'the lost text is built per run (see case-lost.test.js)');
  assert.match(ENDINGS['open-file'].paragraphs[0], /Vale/);
});

test('an empty journal before the mission shows one quiet sentence, which goes once the mission is read', async () => {
  const { BLANK_JOURNAL } = await import('../journal.js');
  installFakeDom();
  assert.ok(BLANK_JOURNAL.split(/\s+/).length <= 15);
  for (const compact of [false, true]) {
    const box = createContainer(), side = compact ? createContainer() : null;
    renderJournal(box, journalModel(newGame()), side);
    assert.match(box.textContent, /The pages are still blank/);
    renderJournal(box, journalModel(started()), side);
    assert.doesNotMatch(box.textContent, /The pages are still blank/);
  }
});

test('M explains the setup and, while the safe is closed, the four letters', () => {
  const s = readMission(newGame()).state;
  assert.deepEqual(dialogueFor('m', s).lines, ['Four stations, four letters. Put them together and the safe is yours.']);
  assert.match(dialogueFor('m', newGame()).lines[0], /is a copy.*curator’s safe.*four clues.*new conservation temp/);
});

test('after the safe opens the journal spells the code word OILS; before that it keeps station order', () => {
  let s = started();
  for (const id of ALL) s = solveStation(s, id, {}).state;
  assert.equal(journalModel(s).slots.map(slot => slot.letter).join(''), 'ILOS', 'closed safe: by station number, the word stays hidden');
  s = tryOpenSafe(s, 'OILS').state;
  assert.equal(journalModel(s).slots.map(slot => slot.letter).join(''), 'OILS');
  assert.deepEqual(journalModel(s).slots.map(slot => slot.number), [3, 1, 2, 4], 'each letter keeps its station label');
});
