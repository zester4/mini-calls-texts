import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.TWILIO_ACCOUNT_SID = `AC${'1'.repeat(32)}`;
process.env.PUBLIC_BASE_URL = 'https://api.example.test';
const { startOutboundCall, saveInboundCall, updateCallStatus } = await import('../src/services/calls.service.js');

function makeDependencies(provider) {
  const state = { record: null, updates: [], upserts: [] };
  const prisma = { call: {
    create: async ({ data }) => (state.record = { id: 'call-1', ...data }),
    update: async ({ where, data }) => (state.record = { ...state.record, id: where.id, ...data }),
    updateMany: async (args) => { state.updates.push(args); return { count: 1 }; },
    upsert: async (args) => { state.upserts.push(args); return { id: 'inbound-call' }; },
  } };
  return {
    state,
    prisma,
    getTwilioPhoneNumber: () => '+14155550000',
    getTwilioClient: () => ({ calls: { create: provider } }),
    publicBaseUrl: 'https://api.example.test',
  };
}

test('outbound call is persisted and linked to the provider SID', async () => {
  const dependencies = makeDependencies(async (payload) => {
    assert.equal(payload.to, '+14155552671');
    assert.equal(payload.from, '+14155550000');
    assert.equal(payload.url, 'https://api.example.test/api/twilio/outbound-voice');
    return { sid: `CA${'2'.repeat(32)}`, status: 'queued' };
  });
  const result = await startOutboundCall({ to: '+14155552671' }, dependencies);
  assert.equal(dependencies.state.record.status, 'queued');
  assert.equal(result.id, 'call-1');
  assert.equal(result.twilioCallSid, `CA${'2'.repeat(32)}`);
  assert.equal(result.status, 'queued');
});

test('provider call failures mark the record failed and return a safe error', async () => {
  const dependencies = makeDependencies(async () => { throw Object.assign(new Error('secret provider detail'), { code: 20404 }); });
  await assert.rejects(startOutboundCall({ to: '+14155552671' }, dependencies), (error) => {
    assert.equal(error.status, 502);
    assert.equal(error.code, 'CALL_PROVIDER_ERROR');
    assert.equal(error.message, 'Unable to start the call with the phone provider');
    return true;
  });
  assert.equal(dependencies.state.record.status, 'failed');
});

test('inbound calls are normalized and upserted by Twilio SID', async () => {
  const dependencies = makeDependencies(async () => ({}));
  const sid = `CA${'6'.repeat(32)}`;
  await saveInboundCall({
    CallSid: sid,
    From: '+1 (415) 555-2671',
    To: '+1 (415) 555-0000',
    CallStatus: 'ringing',
    AccountSid: process.env.TWILIO_ACCOUNT_SID,
  }, dependencies);
  assert.equal(dependencies.state.upserts[0].where.twilioCallSid, sid);
  assert.equal(dependencies.state.upserts[0].create.direction, 'inbound');
  assert.equal(dependencies.state.upserts[0].create.fromNumber, '+14155552671');
});

test('inbound calls reject an unexpected Twilio account SID', async () => {
  const dependencies = makeDependencies(async () => ({}));
  await saveInboundCall({
    CallSid: `CA${'7'.repeat(32)}`,
    From: '+14155552671',
    To: '+14155550000',
    AccountSid: `AC${'2'.repeat(32)}`,
  }, dependencies);
  assert.equal(dependencies.state.upserts.length, 0);
});

test('call status callbacks update only the matching provider call SID', async () => {
  const dependencies = makeDependencies(async () => ({}));
  await updateCallStatus({ CallSid: `CA${'3'.repeat(32)}`, CallStatus: 'completed' }, dependencies);
  assert.equal(dependencies.state.updates[0].where.twilioCallSid, `CA${'3'.repeat(32)}`);
  assert.equal(dependencies.state.updates[0].data.status, 'completed');
  assert.ok(dependencies.state.updates[0].data.endedAt instanceof Date);
});
