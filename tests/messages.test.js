import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMessageSchema } from '../src/validators/message.schema.js';

test('message requests validate destination and body', () => {
  assert.deepEqual(createMessageSchema.parse({ to: '+44 7700 900123', body: 'Hello there' }), { to: '+447700900123', body: 'Hello there' });
});

test('message requests reject empty or oversized bodies', () => {
  assert.equal(createMessageSchema.safeParse({ to: '+14155552671', body: ' ' }).success, false);
  assert.equal(createMessageSchema.safeParse({ to: '+14155552671', body: 'x'.repeat(1601) }).success, false);
});
