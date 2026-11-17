import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { interactionFor, nudgeOffset, NUDGE_MS, NUDGE_TILES } from './interaction.js';
import { recipe } from './story/sound.js';

test('with nothing nearby the key only nudges – no dialog', () => {
  assert.equal(interactionFor({ atVaultDoor: false, target: null }), 'nudge');
  assert.equal(interactionFor({ atVaultDoor: false, target: { id: 'ledger' } }), 'object', 'real objects work as before');
  assert.equal(interactionFor({ atVaultDoor: true, target: null }), 'vault');
});

test('the game no longer has a "Nothing nearby" popup text', () => {
  const main = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /Nothing nearby/);
});

test('the shake is short and small, and still with reduced motion', () => {
  const offsets = Array.from({ length: 20 }, (_, i) => nudgeOffset(i * 10));
  assert.ok(offsets.some(x => x !== 0), 'it moves');
  assert.ok(offsets.every(x => Math.abs(x) <= NUDGE_TILES));
  assert.equal(nudgeOffset(NUDGE_MS), 0, 'over after 200 ms');
  assert.equal(nudgeOffset(-Infinity), 0);
  assert.equal(nudgeOffset(50, true), 0, 'reduced motion: no shake');
});

test('the "nudge" sound is very quiet and short', () => {
  const tones = recipe('nudge');
  assert.equal(tones.length, 1);
  assert.ok(tones[0].volume <= 0.15 && tones[0].duration <= 0.1);
});
