import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, isE164 } from '../src/lib/phone.js';

test('normalizes formatting while preserving international country code', () => {
  assert.equal(normalizePhone('+1 (415) 555-2671'), '+14155552671');
  assert.equal(normalizePhone('+44 7700-900123'), '+447700900123');
});

test('rejects national, malformed, and out-of-range phone numbers', () => {
  assert.equal(normalizePhone('4155552671'), null);
  assert.equal(normalizePhone('+0123456789'), null);
  assert.equal(normalizePhone('+123'), null);
  assert.equal(normalizePhone('+1234567890123456'), null);
  assert.equal(isE164('+14155552671'), true);
  assert.equal(isE164('14155552671'), false);
});
