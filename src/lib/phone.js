// Normalize phone numbers to E.164
export function normalizePhone(phone) {
  if (!phone) return null;
  // Basic cleanup - expand as needed
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}
