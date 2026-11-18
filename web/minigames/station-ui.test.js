import test from 'node:test';
import assert from 'node:assert/strict';
import { speedScale, tierPoints, speedLayout, speedBar, shortcutButton, successPopup, creditLine, showPopup } from './station-ui.js';
import { portraitSpeedPoints, pictureSpeedPoints } from '../story/scoring.js';
import { installFakeDom, createContainer, findAll } from '../story/tests/fake-dom.js';

import { PORTRAIT_TIERS } from './portrait-timeline.js';

test('Station I tiers with four cards: 0/25/40/55 s', () => {
  assert.deepEqual(PORTRAIT_TIERS, [{ s: 0, p: 15 }, { s: 25, p: 10 }, { s: 40, p: 5 }, { s: 55, p: 0 }]);
});
const PICTURE_TIERS = [{ s: 0, p: 15 }, { s: 30, p: 10 }, { s: 45, p: 5 }, { s: 60, p: 0 }];

test('the bar scale matches L (70 s for 0/30/45/60) and is 65 s for Station I', () => {
  assert.equal(speedScale(PICTURE_TIERS), 70);
  assert.equal(speedScale(PORTRAIT_TIERS), 65);
});

test('tier points agree with the real scoring of both stations at every boundary', () => {
  for (const ms of [0, 1, 24999, 25000, 25001, 40000, 40001, 55000, 55001, 90000]) {
    assert.equal(tierPoints(PORTRAIT_TIERS, ms), portraitSpeedPoints(ms), `I ${ms}`);
  }
  for (const ms of [0, 30000, 30001, 45000, 45001, 60000, 60001]) {
    assert.equal(tierPoints(PICTURE_TIERS, ms), pictureSpeedPoints(ms), `L ${ms}`);
  }
});

test('marks sit where L draws them, and the reward labels fill the whole bar', () => {
  const picture = speedLayout(PICTURE_TIERS);
  assert.deepEqual(picture.marks.map(m => m.toFixed(3)), ['0.000', '42.857', '64.286', '85.714']); // L's CSS values
  const portrait = speedLayout(PORTRAIT_TIERS);
  assert.deepEqual(portrait.marks.map(m => Math.round(m)), [0, 38, 62, 85]);
  assert.equal(Math.round(portrait.widths.reduce((a, b) => a + b, 0)), 100);
});

test('the bar fills with time and tells screen readers the points', () => {
  installFakeDom();
  const bar = speedBar({ tiers: PORTRAIT_TIERS });
  const [rewards, track, marks] = bar.root.children;
  assert.deepEqual(rewards.children.map(c => c.textContent), ['+15 points', '+10 points', '+5 points', '+0 points']);
  assert.deepEqual(marks.children.map(c => c.textContent), ['0s', '25s', '40s', '55s']);
  bar.update(32500);   // half of the 65 s scale
  assert.equal(track.children[0].style.width, '50%');
  assert.equal(track.getAttribute('aria-valuetext'), '32 seconds; 10 points on completion');
  bar.update(999999);
  assert.equal(track.children[0].style.width, '100%');
});

test('buttons carry key badges like L, and popups show the letter and points', () => {
  installFakeDom();
  const start = shortcutButton('Start', () => {}, 'Enter');
  assert.equal(start.textContent, 'Start↵');
  assert.equal(start.getAttribute('aria-keyshortcuts'), 'Enter');
  const contents = successPopup({ headline: 'Sorted!', letter: 'I', points: 10 });
  const box = createContainer();
  box.append(...contents);
  assert.match(box.textContent, /Sorted!Iadded to journal\+10 points earned/);
  const overlay = createContainer();
  const pane = createContainer();
  let pressed = 0;
  const close = showPopup({ overlay, pane, label: 'Done', contents: [], actionLabel: 'Return to museum', onAction: () => pressed++ });
  assert.equal(pane.inert, true);
  findAll(overlay, n => n.tagName === 'BUTTON')[0].click();
  assert.equal(pressed, 1);
  close();
  assert.equal(pane.inert, false);
  assert.equal(overlay.children.length, 0);
});

test('one credit line in L’s format', () => {
  installFakeDom();
  const line = creditLine([{ artist: 'Edgar Degas', shortTitle: 'A Woman Seated', date: '1865' }, { artist: 'John Singer Sargent', shortTitle: 'Madame X', date: '1883–84' }]);
  assert.equal(line.textContent, 'Edgar Degas, A Woman Seated, 1865 · John Singer Sargent, Madame X, 1883–84. Public domain · The Metropolitan Museum of Art');
  const hidden = creditLine([{ artist: 'Edgar Degas', shortTitle: 'A Woman Seated', date: '1865' }], { dates: false });
  assert.doesNotMatch(hidden.textContent, /1865/, 'Station I must not give the years away');
});
