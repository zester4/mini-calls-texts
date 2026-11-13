import { PrismaClient } from '@prisma/client';
import { normalizePhone } from '../lib/phone.js';

const prisma = new PrismaClient();

export async function upsertContact({ name, phone }) {
  const normalized = normalizePhone(phone);
  return prisma.contact.upsert({
    where: { phone: normalized },
    update: { name },
    create: { name, phone: normalized },
  });
}
