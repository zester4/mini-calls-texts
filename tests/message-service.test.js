import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.TWILIO_ACCOUNT_SID = `AC${'1'.repeat(32)}`;
process.env.PUBLIC_BASE_URL = 'https://api.example.test';
const { sendOutboundMessage, saveInboundMessage, updateMessageStatus } = await import('../src/services/messages.service.js');

function makeDependencies(provider) {
  const state = { record: null, updates: [] };
  const prisma = { message: {
    create: async ({ data }) => (state.record = { id: 'message-1', ...data }),
    update: async ({ where, data }) => (state.record = { ...state.record, id: where.id, ...data }),
    upsert: async (args) => { state.updates.push(args); return { id: 'inbound-1' }; },
    updateMany: async (args) => { state.updates.push(args); return { count: 1 }; },
  } };
  return {
    state,
    prisma,
    getTwilioPhoneNumber: () => '+14155550000',
    getTwilioClient: () => ({ messages: { create: provider } }),
    publicBaseUrl: 'https://api.example.test',
  };
}

test('outbound SMS is persisted and linked to the provider SID', async () => {
  const dependencies = makeDependencies(async (payload) => {
    assert.equal(payload.to, '+14155552671');
    assert.equal(payload.from, '+14155550000');
    assert.equal(payload.body, 'Hello');
    assert.equal(payload.statusCallback, 'https://api.example.test/api/twilio/message-status');
    return { sid: `SM${'2'.repeat(32)}`, status: 'queued' };
  });
  const result = await sendOutboundMessage({ to: '+14155552671', body: 'Hello' }, dependencies);
  assert.equal(dependencies.state.record.status, 'queued');
  assert.equal(result.id, 'message-1');
  assert.equal(result.twilioMessageSid, `SM${'2'.repeat(32)}`);
  assert.equal(result.status, 'queued');
});

test('provider SMS failures mark the message failed and return a safe error', async () => {
  const dependencies = makeDependencies(async () => { throw Object.assign(new Error('secret provider detail'), { code: 30003 }); });
  await assert.rejects(sendOutboundMessage({ to: '+14155552671', body: 'Hello' }, dependencies), (error) => {
    assert.equal(error.status, 502);
    assert.equal(error.code, 'MESSAGE_PROVIDER_ERROR');
    assert.equal(error.message, 'Unable to send the message with the phone provider');
    return true;
  });
  assert.equal(dependencies.state.record.status, 'failed');
});

test('inbound SMS is upserted by provider SID for webhook retry safety', async () => {
  const dependencies = makeDependencies(async () => ({}));
  await saveInboundMessage({
    AccountSid: process.env.TWILIO_ACCOUNT_SID,
    From: '+14155552671',
    To: '+14155550000',
    Body: 'Incoming',
    MessageSid: `SM${'4'.repeat(32)}`,
  }, dependencies);
  assert.equal(dependencies.state.updates[0].where.twilioMessageSid, `SM${'4'.repeat(32)}`);
  assert.equal(dependencies.state.updates[0].create.direction, 'inbound');
  assert.equal(dependencies.state.updates[0].create.body, 'Incoming');
});

test('message delivery callbacks update status by provider SID', async () => {
  const dependencies = makeDependencies(async () => ({}));
  await updateMessageStatus({ MessageSid: `SM${'5'.repeat(32)}`, MessageStatus: 'delivered' }, dependencies);
  assert.equal(dependencies.state.updates[0].where.twilioMessageSid, `SM${'5'.repeat(32)}`);
  assert.equal(dependencies.state.updates[0].data.status, 'delivered');
});
