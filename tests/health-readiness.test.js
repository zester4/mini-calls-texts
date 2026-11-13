import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReadinessHandler } from '../src/routes/health.routes.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('readiness handler returns ready when PostgreSQL responds', async () => {
  const response = createResponse();
  const handler = createReadinessHandler({ $queryRaw: async () => [{ '?column?': 1 }] });
  await handler({}, response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ready', database: 'connected' });
});

test('readiness handler returns 503 when PostgreSQL is unavailable', async () => {
  const response = createResponse();
  const handler = createReadinessHandler({ $queryRaw: async () => { throw new Error('connection refused'); } });
  await handler({}, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { status: 'not_ready', database: 'unavailable' });
});
