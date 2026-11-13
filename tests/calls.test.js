import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCallSchema } from '../src/validators/call.schema.js';

test('call requests normalize international numbers', () => {
  assert.deepEqual(createCallSchema.parse({ to: '+1 (415) 555-2671' }), { to: '+14155552671' });
});

test('call requests reject ambiguous local numbers', () => {
  assert.equal(createCallSchema.safeParse({ to: '4155552671' }).success, false);
});
