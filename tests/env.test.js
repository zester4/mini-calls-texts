import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/minicalls';
process.env.TWILIO_ACCOUNT_SID = `AC${'1'.repeat(32)}`;
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-auth-token';
process.env.TWILIO_PHONE_NUMBER = '+14155550000';
process.env.APP_API_KEY = 'a'.repeat(32);
process.env.PUBLIC_BASE_URL = 'https://mini-calls.example.test/';
process.env.FORWARD_CALL_TO = '+14155550001';

const { env, assertProductionConfig } = await import('../src/config/env.js');

test('accepts valid production configuration and normalizes the public origin', () => {
  assert.doesNotThrow(assertProductionConfig);
  assert.equal(env.PUBLIC_BASE_URL, 'https://mini-calls.example.test');
});

test('rejects an undersized production API key', () => {
  const original = env.APP_API_KEY;
  env.APP_API_KEY = 'short';
  assert.throws(assertProductionConfig, /at least 32 characters/);
  env.APP_API_KEY = original;
});

test('requires a forwarding destination for production two-way calls', () => {
  const original = env.FORWARD_CALL_TO;
  env.FORWARD_CALL_TO = undefined;
  assert.throws(assertProductionConfig, /FORWARD_CALL_TO/);
  env.FORWARD_CALL_TO = original;
});
