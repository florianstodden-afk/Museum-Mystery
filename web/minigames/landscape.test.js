import test from 'node:test';
import assert from 'node:assert/strict';
import {LANDSCAPE_WORKS, catalogueFacts, initialLandscape, answer, hint, stationScore} from './landscape.js';
test('landscape station deducts mistakes and hints and awards B points once solved', () => {
  let s = initialLandscape(); s = answer(s, '1881', 'watercolor'); s = hint(s); s = hint(s);
  assert.equal(s.hints, 1); s = answer(s, '1889', 'oil'); assert.equal(stationScore(s), 12);
  assert.equal(answer(s, '1881', 'watercolor'), s);
});
test('landscape station keeps a five point minimum', () => {
  let s = initialLandscape(); for (let i = 0; i < 12; i++) s = answer(s, '1881', 'oil');
  s = answer(s, '1889', 'oil'); assert.equal(stationScore(s), 5);
});
test('Met facts fall back safely and only accept the matching public-domain object', () => {
  const work = LANDSCAPE_WORKS[1];
  assert.equal(catalogueFacts(work), '1881 · Chalk, pastel and watercolor');
  assert.equal(catalogueFacts(work, { objectID: 42, isPublicDomain: true, objectDate: '1900' }), catalogueFacts(work));
  assert.equal(catalogueFacts(work, { objectID: work.id, isPublicDomain: true, objectDate: '1881', medium: 'Chalk and watercolor' }), '1881 · Chalk and watercolor');
});
