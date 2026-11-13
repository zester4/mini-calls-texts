// Accept international numbers only; local/national numbers are ambiguous without a region.
export function normalizePhone(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return null;
  const digits = trimmed.slice(1).replace(/[\s().-]/g, '');
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `+${digits}`;
}

export function isE164(value) {
  return typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value);
}
