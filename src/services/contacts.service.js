import { prisma } from '../lib/prisma.js';
import { normalizePhone } from '../lib/phone.js';

export async function upsertContact({ name, phone }) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    const error = new Error('Phone number must be in E.164 format');
    error.status = 400;
    error.code = 'INVALID_PHONE_NUMBER';
    throw error;
  }
  return prisma.contact.upsert({
    where: { phone: normalized },
    update: { name },
    create: { name, phone: normalized },
  });
}
