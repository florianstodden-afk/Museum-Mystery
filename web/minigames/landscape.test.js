import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLandscape, answer, hint, stationScore} from './landscape.js';
test('landscape station deducts mistakes and hints and awards B points once solved', () => {
  let s = initialLandscape(); s = answer(s, '1881', 'watercolor'); s = hint(s); s = hint(s);
  assert.equal(s.hints, 1); s = answer(s, '1889', 'oil'); assert.equal(stationScore(s), 12);
  assert.equal(answer(s, '1881', 'watercolor'), s);
});
test('landscape station keeps a five point minimum', () => {
  let s = initialLandscape(); for (let i = 0; i < 12; i++) s = answer(s, '1881', 'oil');
  s = answer(s, '1889', 'oil'); assert.equal(stationScore(s), 5);
});
