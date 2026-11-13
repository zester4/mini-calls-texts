import { prisma } from '../lib/prisma.js';
import { getTwilioClient, getTwilioPhoneNumber } from '../lib/twilio.js';
import { normalizePhone } from '../lib/phone.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const callStatuses = new Set(['queued', 'initiated', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer', 'canceled']);

export async function startOutboundCall({ to }, dependencies = {}) {
  const db = dependencies.prisma ?? prisma;
  const getClient = dependencies.getTwilioClient ?? getTwilioClient;
  const getNumber = dependencies.getTwilioPhoneNumber ?? getTwilioPhoneNumber;
  const fromNumber = getNumber();
  const publicBaseUrl = dependencies.publicBaseUrl ?? env.PUBLIC_BASE_URL;
  if (!publicBaseUrl) {
    const error = new Error('PUBLIC_BASE_URL is not configured');
    error.status = 503;
    throw error;
  }

  const record = await db.call.create({
    data: { direction: 'outbound', fromNumber, toNumber: to, status: 'queued' },
  });

  let providerCall;
  try {
    providerCall = await getClient().calls.create({
      to, from: fromNumber,
      url: `${publicBaseUrl}/api/twilio/outbound-voice`,
      method: 'POST',
      statusCallback: `${publicBaseUrl}/api/twilio/call-status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });
  } catch (cause) {
    await db.call.update({
      where: { id: record.id },
      data: { status: 'failed', endedAt: new Date(), statusUpdatedAt: new Date(), errorCode: cause.code ? String(cause.code) : null },
    });
    logger.error('outbound_call_failed', { callId: record.id, code: cause.code });
    const error = new Error('Unable to start the call with the phone provider');
    error.status = 502;
    error.code = 'CALL_PROVIDER_ERROR';
    throw error;
  }

  return db.call.update({
    where: { id: record.id },
    data: { twilioCallSid: providerCall.sid, status: providerCall.status, statusUpdatedAt: new Date() },
  });
}

export async function listRecentCalls({ limit = 50 } = {}, db = prisma) {
  return db.call.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
}

export async function saveInboundCall(body, { prisma: db = prisma } = {}) {
  const { CallSid, From, To, CallStatus = 'ringing', AccountSid } = body;
  const fromNumber = normalizePhone(From);
  const toNumber = normalizePhone(To);
  if (!CallSid || !fromNumber || !toNumber) return;
  if (env.TWILIO_ACCOUNT_SID && AccountSid !== env.TWILIO_ACCOUNT_SID) return;
  return db.call.upsert({
    where: { twilioCallSid: CallSid },
    update: { status: callStatuses.has(CallStatus) ? CallStatus : 'ringing', statusUpdatedAt: new Date() },
    create: { direction: 'inbound', fromNumber, toNumber, status: callStatuses.has(CallStatus) ? CallStatus : 'ringing', twilioCallSid: CallSid, statusUpdatedAt: new Date() },
  });
}

export async function updateCallStatus(body, { prisma: db = prisma } = {}) {
  const { CallSid, CallStatus, DialCallStatus, ErrorCode } = body;
  const status = DialCallStatus || CallStatus;
  if (!CallSid || !callStatuses.has(status)) return;
  const now = new Date();
  const data = { status, statusUpdatedAt: now };
  if (status === 'in-progress') data.startedAt = now;
  if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(status)) data.endedAt = now;
  if (ErrorCode) data.errorCode = String(ErrorCode);
  await db.call.updateMany({ where: { twilioCallSid: CallSid }, data });
}
