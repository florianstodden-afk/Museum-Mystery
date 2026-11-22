import test from 'node:test';
import assert from 'node:assert/strict';

test('a final flush waits until the winning snapshot has been saved', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const snapshot = JSON.parse(options.body);
    if (!snapshot.finished) await firstUpload.promise;
    else {
      finalStarted.resolve();
      await finalUpload.promise;
    }
    return Response.json({ ok: true });
  });
  globalThis.location = { hostname: 'game.example' };
  t.after(() => { delete globalThis.location; });
  const { createCloudSync } = await import('../web/github-auth.js');
  const firstUpload = Promise.withResolvers();
  const finalStarted = Promise.withResolvers();
  const finalUpload = Promise.withResolvers();
  let finished = false;
  const sync = createCloudSync(() => ({ finished }));
  const first = sync.flush();
  finished = true;
  let readyToPublish = false;
  const last = sync.flush().then(() => { readyToPublish = true; });
  firstUpload.resolve();
  await finalStarted.promise;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(readyToPublish, false);
  finalUpload.resolve();
  await Promise.all([first, last]);
  assert.equal(readyToPublish, true);
});
