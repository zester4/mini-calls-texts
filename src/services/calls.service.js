import { PrismaClient } from '@prisma/client';
import { client, phoneNumber } from '../lib/twilio.js';
import { normalizePhone } from '../lib/phone.js';
import { env } from '../config/env.js';

const prisma = new PrismaClient();

export async function startOutboundCall({ to }) {
  const toNumber = normalizePhone(to);
  if (!toNumber) throw new Error('Invalid phone number');

  const call = await prisma.call.create({
    data: {
      direction: 'outbound',
      fromNumber: phoneNumber,
      toNumber,
      status: 'queued',
    },
  });

  const twilioCall = await client.calls.create({
    to: toNumber,
    from: phoneNumber,
    url: `${env.PUBLIC_BASE_URL}/api/twilio/voice`, // or a dedicated TwiML endpoint
    statusCallback: `${env.PUBLIC_BASE_URL}/api/twilio/call-status`,
  });

  await prisma.call.update({
    where: { id: call.id },
    data: { twilioCallSid: twilioCall.sid, status: twilioCall.status },
  });

  return call;
}

export async function listRecentCalls() {
  return prisma.call.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
}

export async function updateCallStatus(body) {
  const { CallSid, CallStatus } = body;
  if (!CallSid) return;
  await prisma.call.updateMany({
    where: { twilioCallSid: CallSid },
    data: { status: CallStatus },
  });
}
