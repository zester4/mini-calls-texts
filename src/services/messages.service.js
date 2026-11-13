import { prisma } from '../lib/prisma.js';
import { getTwilioClient, getTwilioPhoneNumber } from '../lib/twilio.js';
import { normalizePhone } from '../lib/phone.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const messageStatuses = new Set(['queued', 'accepted', 'scheduled', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'receiving', 'received', 'read', 'canceled']);

export async function sendOutboundMessage({ to, body }, dependencies = {}) {
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
  const record = await db.message.create({
    data: { direction: 'outbound', fromNumber, toNumber: to, body, status: 'queued' },
  });

  let providerMessage;
  try {
    providerMessage = await getClient().messages.create({
      to, from: fromNumber, body,
      statusCallback: `${publicBaseUrl}/api/twilio/message-status`,
    });
  } catch (cause) {
    await db.message.update({
      where: { id: record.id },
      data: { status: 'failed', statusUpdatedAt: new Date(), errorCode: cause.code ? String(cause.code) : null },
    });
    logger.error('outbound_message_failed', { messageId: record.id, code: cause.code });
    const error = new Error('Unable to send the message with the phone provider');
    error.status = 502;
    error.code = 'MESSAGE_PROVIDER_ERROR';
    throw error;
  }

  return db.message.update({
    where: { id: record.id },
    data: { twilioMessageSid: providerMessage.sid, status: providerMessage.status, statusUpdatedAt: new Date() },
  });
}

export async function listRecentMessages({ limit = 50 } = {}, db = prisma) {
  return db.message.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
}

export async function getThread(phone, db = prisma) {
  return db.message.findMany({
    where: { OR: [{ fromNumber: phone }, { toNumber: phone }] },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
}

export async function saveInboundMessage(body, { prisma: db = prisma } = {}) {
  const { From, To, Body, MessageSid, AccountSid } = body;
  const fromNumber = normalizePhone(From);
  const toNumber = normalizePhone(To);
  if (!fromNumber || !toNumber || typeof Body !== 'string' || !MessageSid) return;
  if (env.TWILIO_ACCOUNT_SID && AccountSid !== env.TWILIO_ACCOUNT_SID) return;
  return db.message.upsert({
    where: { twilioMessageSid: MessageSid },
    update: {},
    create: { direction: 'inbound', fromNumber, toNumber, body: Body, status: 'received', twilioMessageSid: MessageSid, statusUpdatedAt: new Date() },
  });
}

export async function updateMessageStatus(body, { prisma: db = prisma } = {}) {
  const { MessageSid, MessageStatus, SmsStatus, ErrorCode } = body;
  const status = MessageStatus || SmsStatus;
  if (!MessageSid || !messageStatuses.has(status)) return;
  const data = { status, statusUpdatedAt: new Date() };
  if (ErrorCode) data.errorCode = String(ErrorCode);
  await db.message.updateMany({
    where: { twilioMessageSid: MessageSid },
    data,
  });
}
