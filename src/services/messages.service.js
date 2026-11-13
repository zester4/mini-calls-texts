import { PrismaClient } from '@prisma/client';
import { client, phoneNumber } from '../lib/twilio.js';
import { normalizePhone } from '../lib/phone.js';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

export async function sendOutboundMessage({ to, body }) {
  const toNumber = normalizePhone(to);
  if (!toNumber) throw new Error('Invalid phone number');

  const message = await prisma.message.create({
    data: {
      direction: 'outbound',
      fromNumber: phoneNumber,
      toNumber,
      body,
      status: 'queued',
    },
  });

  const twilioMsg = await client.messages.create({
    to: toNumber,
    from: phoneNumber,
    body,
    statusCallback: `${env.PUBLIC_BASE_URL}/api/twilio/message-status`,
  });

  await prisma.message.update({
    where: { id: message.id },
    data: { twilioMessageSid: twilioMsg.sid, status: twilioMsg.status },
  });

  return message;
}

export async function listRecentMessages() {
  return prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
}

export async function getThread(phone) {
  const normalized = normalizePhone(phone);
  return prisma.message.findMany({
    where: {
      OR: [{ fromNumber: normalized }, { toNumber: normalized }],
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function saveInboundMessage(body) {
  const { From, To, Body, MessageSid } = body;
  await prisma.message.create({
    data: {
      direction: 'inbound',
      fromNumber: From,
      toNumber: To,
      body: Body,
      status: 'received',
      twilioMessageSid: MessageSid,
    },
  });
}

export async function updateMessageStatus(body) {
  const { MessageSid, MessageStatus } = body;
  if (!MessageSid) return;
  await prisma.message.updateMany({
    where: { twilioMessageSid: MessageSid },
    data: { status: MessageStatus },
  });
}
