import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERACTION_POINTS, examine, pointAt } from '../security-office/interactions.js';
import { monitorLayout, clockText, LAYOUT, SCREEN_COUNT } from '../security-office/security-office.js';
import { newGame } from '../engine.js';

test('the monitor wall unlocks the transport-cart note exactly once', () => {
  const first = examine(newGame(), 'monitor-wall');
  assert.equal(first.ok, true);
  assert.deepEqual(first.state.notes, ['transport-cart']);
  assert.match(first.text, /21:14/);

  const second = examine(first.state, 'monitor-wall');
  assert.equal(second.ok, false);
  assert.equal(second.state, first.state);
  assert.deepEqual(second.state.notes, ['transport-cart']);
});

test('the shift schedule prepares station 2 without solving it', () => {
  const result = examine(newGame(), 'shift-schedule');
  assert.deepEqual(result.state.notes, ['duty-roster']);
  assert.equal(result.state.stations.portraits.solved, false);
  assert.deepEqual(result.state.letters, [null, null, null, null]);
});

test('radio and key cabinet only tell a story', () => {
  const s = newGame();
  for (const id of ['radio', 'key-cabinet']) {
    const result = examine(s, id);
    assert.equal(result.state, s);
    assert.ok(result.text.length > 20);
  }
  assert.equal(examine(s, 'coffee-machine').ok, false);
});

test('every interaction point lies inside the room', () => {
  for (const { id, area } of INTERACTION_POINTS) {
    assert.ok(area.x >= 0 && area.y >= 0, id);
    assert.ok(area.x + area.w <= 1 && area.y + area.h <= 1, id);
    assert.ok(area.w > 0 && area.h > 0, id);
  }
});

test('interaction points do not overlap, so a click is never ambiguous', () => {
  for (const a of INTERACTION_POINTS) {
    for (const b of INTERACTION_POINTS) {
      if (a === b) continue;
      const overlap = a.area.x < b.area.x + b.area.w && b.area.x < a.area.x + a.area.w
        && a.area.y < b.area.y + b.area.h && b.area.y < a.area.y + a.area.h;
      assert.equal(overlap, false, `${a.id} overlaps ${b.id}`);
    }
  }
});

test('a click in the middle of the monitor wall finds it', () => {
  const wall = LAYOUT.monitorWall;
  assert.equal(pointAt(wall.x + wall.w / 2, wall.y + wall.h / 2).id, 'monitor-wall');
  assert.equal(pointAt(0.5, 0.95), null);
});

test('nine screens fit inside the monitor wall', () => {
  const width = 1672;
  const height = 941;
  const screens = monitorLayout(width, height);
  assert.equal(screens.length, SCREEN_COUNT);
  const wall = LAYOUT.monitorWall;
  for (const s of screens) {
    assert.ok(s.x >= wall.x * width && s.x + s.w <= (wall.x + wall.w) * width + 0.001);
    assert.ok(s.y >= wall.y * height && s.y + s.h <= (wall.y + wall.h) * height + 0.001);
  }
});

test('the camera clock starts at 21:12 and reaches 21:14', () => {
  assert.equal(clockText(0), '21:12:00');
  assert.equal(clockText(120000), '21:14:00');
});
