import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.TWILIO_AUTH_TOKEN = 'webhook-test-token';
process.env.PUBLIC_BASE_URL = 'https://api.example.test';
const { validateTwilioSignature } = await import('../src/lib/webhook.js');

function makeRequest(signature, contentType = 'application/x-www-form-urlencoded') {
  return {
    originalUrl: '/api/twilio/sms',
    body: { Body: 'hello', From: '+14155552671' },
    get: (header) => header.toLowerCase() === 'x-twilio-signature' ? signature : undefined,
    is: (type) => contentType === type,
  };
}

test('accepts a correctly signed Twilio form webhook', () => {
  const url = 'https://api.example.test/api/twilio/sms';
  const params = { Body: 'hello', From: '+14155552671' };
  const signed = url + Object.keys(params).sort().map((key) => key + params[key]).join('');
  const signature = createHmac('sha1', process.env.TWILIO_AUTH_TOKEN).update(signed).digest('base64');
  assert.equal(validateTwilioSignature(makeRequest(signature)), true);
});

test('rejects missing or invalid signatures and non-form payloads', () => {
  assert.equal(validateTwilioSignature(makeRequest(undefined)), false);
  assert.equal(validateTwilioSignature(makeRequest('not-a-signature')), false);
  assert.equal(validateTwilioSignature(makeRequest('anything', 'application/json')), false);
});
