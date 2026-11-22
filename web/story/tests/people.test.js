import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, tryOpenSafe, accuse } from '../engine.js';
import { STATION_IDS, CODEWORD } from '../case-1.js';
import { peopleModel, renderPeople, meet, isMet, NOT_MET, PEOPLE } from '../people.js';
import { serialize, deserialize } from '../save.js';
import { createStoryHost, memoryStorage } from '../host.js';
import { installFakeDom, createContainer, findAll } from './fake-dom.js';

const started = () => readMission(newGame()).state;
function safeOpen() {
  let s = started();
  for (const id of STATION_IDS) s = solveStation(s, id, {}).state;
  return tryOpenSafe(s, CODEWORD).state;
}
const byId = (model, id) => model.find(p => p.id === id);

test('everyone starts as “?” / Not met yet', () => {
  for (const person of peopleModel(started())) {
    assert.deepEqual([person.met, person.name, person.line], [false, '?', NOT_MET], person.id);
  }
});

test('Leon and Imani unlock after the first conversation, Vale after her door card', () => {
  let s = started();
  s = meet(s, 'leon');
  assert.equal(byId(peopleModel(s), 'leon').name, 'Leon');
  assert.equal(byId(peopleModel(s), 'imani').met, false);
  s = meet(s, 'imani');
  assert.deepEqual(byId(peopleModel(s), 'imani'), { id: 'imani', met: true, name: 'Imani', role: 'Conservator', line: 'In the studio until 22:00.', portrait: 'restorer' });
  s = meet(s, 'vale');
  assert.equal(byId(peopleModel(s), 'vale').line, 'Away at the gala tonight.');
  assert.equal(meet(s, 'vale'), s, 'meeting twice changes nothing');
  assert.equal(meet(s, 'm'), s, 'M is not a person on this page');
  assert.equal(byId(peopleModel(s), 'voss').met, false);
});

test('Vale and Voss unlock at the latest when the safe opens (the final question appears)', () => {
  const s = safeOpen();
  assert.equal(isMet(s, 'vale'), true);
  assert.deepEqual(byId(peopleModel(s), 'voss'), { id: 'voss', met: true, name: 'Adrien Voss', role: 'Patron', line: 'Paid for the new Gallery wing.', portrait: 'silhouette' });
});

test('no spoilers before the accusation; “Signed as ‘M’.” only after the right one', () => {
  let s = meet(meet(meet(safeOpen(), 'leon'), 'imani'), 'vale');
  const text = peopleModel(s).map(p => `${p.name} ${p.role} ${p.line}`).join(' ');
  assert.doesNotMatch(text, /suspect|guilty|planned|culprit|Signed|“M”|‘M’/i);
  for (const person of PEOPLE) assert.ok(person.line.split(/\s+/).length <= 12, person.id);
  assert.doesNotMatch(byId(peopleModel(accuse(s, 'leon').state), 'voss').line, /Signed/, 'lost: still not revealed');
  assert.equal(byId(peopleModel(accuse(s, 'voss').state), 'voss').line, 'Paid for the new Gallery wing. Signed as ‘M’.');
});

test('the met list is saved; an old save without it loads, a broken one is rejected', () => {
  const s = meet(started(), 'leon');
  assert.deepEqual(deserialize(serialize(s)).met, ['leon']);
  const old = started();
  delete old.met;
  const loaded = deserialize(serialize(old));
  assert.ok(loaded, 'old save loads');
  assert.equal(byId(peopleModel(loaded), 'leon').met, false);
  assert.equal(deserialize(serialize({ ...s, met: ['leon', 'leon'] })), null);
  assert.equal(deserialize(serialize({ ...s, met: ['nobody'] })), null);
  assert.equal(deserialize(serialize({ ...s, met: 'leon' })), null);
});

test('talking through the host unlocks the person and saves it', () => {
  installFakeDom();
  const storage = memoryStorage();
  const panel = createContainer();
  const host = createStoryHost({ storage, storageKey: 'k', openPanel: () => panel, closePanel() {}, onChange() {} });
  host.start();
  findAll(panel, n => n.tagName === 'BUTTON' && n.textContent.includes('Accept the mission'))[0].click();
  host.talkTo('leon');
  host.talkTo('vale');
  assert.deepEqual(host.state.met, ['leon', 'vale']);
  assert.deepEqual(JSON.parse(JSON.parse(storage.getItem('k')).story).met, ['leon', 'vale']);
});

test('the page renders a portrait, name, role and line per person', () => {
  installFakeDom();
  const box = createContainer();
  const drawn = [];
  renderPeople(box, peopleModel(meet(safeOpen(), 'leon')), (canvas, kind) => drawn.push(kind));
  assert.equal(findAll(box, n => n.tagName === 'LI').length, 4);
  assert.deepEqual(drawn, ['guard', 'restorer'], 'Leon and Vale use the game figures');
  assert.equal(findAll(box, n => n.className === 'journal-silhouette').length, 1, 'Voss is a silhouette');
  assert.match(box.textContent, /LeonNight guardOn duty all night\./);
  assert.match(box.textContent, /\?Not met yet/, 'Imani not met yet');
});
