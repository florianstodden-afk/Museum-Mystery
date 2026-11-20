// The code word must not be readable before playing: players see station numbers 1–4, letters only after solving.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CASE, stationsByNumber } from '../case-1.js';
import { newGame, readMission, solveStation, nextStep } from '../engine.js';
import { hintFor } from '../hints.js';
import { dialogueFor } from '../dialogues.js';
import { journalModel, renderJournal } from '../journal.js';
import { scoreboard, scoreBreakdown } from '../scoring.js';
import { renderScoreboard } from '../scoreboard-view.js';
import { OBJECTS } from '../../engine.js';
import { installFakeDom, createContainer } from './fake-dom.js';

const LEAK = /Station [BILD]\b|\b[BILD] ·|\([BILD]\)/;
const fresh = () => readMission(newGame()).state;
const web = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('stations are numbered 1–4 in walking order: Hall, then Gallery left, middle, right', () => {
  assert.deepEqual(stationsByNumber().map(s => [s.number, s.id]), [[1, 'portraits'], [2, 'restoration'], [3, 'landscape'], [4, 'archive']]);
  const spot = id => OBJECTS.find(o => o.story?.station === id);
  assert.ok(spot('portraits').x < 9, 'station 1 is in the hall');
  assert.ok(spot('restoration').x < spot('landscape').x && spot('landscape').x < spot('archive').x, '2, 3, 4 from left to right');
});

test('nothing the player sees before solving names a station letter', () => {
  const s = fresh();
  const texts = [
    ...OBJECTS.map(o => o.label),
    ...CASE.stations.map(st => `${st.room} · Station ${st.number} ${st.task}`),
    nextStep(s), hintFor(s, 1).text, hintFor(s, 2).text,
    ...['leon', 'imani', 'vale'].flatMap(id => JSON.stringify(dialogueFor(id, s) ?? '')),
    ...scoreBreakdown(s).map(row => row.label),
  ];
  for (const text of texts) assert.doesNotMatch(text, LEAK, text);
  installFakeDom();
  const journal = createContainer();
  renderJournal(journal, journalModel(s));
  assert.doesNotMatch(journal.textContent, LEAK);
  assert.doesNotMatch(journal.textContent, /(?:^|\s)[BILD](?:\s|$)/, 'no single letter in an open slot');
  const board = createContainer();
  renderScoreboard(board, scoreboard(s), null);
  assert.doesNotMatch(board.textContent, LEAK);
});

test('the wall plaques show only the station name: no number, no code-word letter', () => {
  const gallery = web('gallery.js'), hall = web('main.js');
  assert.match(gallery, /\{note:'PUZZLE',painting:'CATALOGUE',frames:'FORGERY'\}/);
  assert.match(hall, /drawWallPlaque\(ctx,mid,y\+height\+9,'PORTRAITS'/);
  assert.doesNotMatch(gallery + hall, /'\w · [A-Z]+'/, 'no "2 · PUZZLE" style labels left');
});

test('after solving, the letter appears in the journal', () => {
  const s = solveStation(fresh(), 'restoration', {}).state;
  const slot = journalModel(s).slots.find(x => x.stationId === 'restoration');
  assert.equal(slot.letter, 'L');
  assert.equal(slot.number, 2);
  assert.ok(journalModel(s).slots.filter(x => !x.solved).every(x => x.letter === '?'));
});
