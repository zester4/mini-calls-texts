const serialize = (value) => {
  if (value instanceof Error) return { name: value.name, message: value.message, code: value.code };
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([key]) => !/token|authorization|body|phone|sid/i.test(key)));
  }
  return value;
};

export const logger = {
  info: (event, context = {}) => console.log(JSON.stringify({ level: 'info', event, ...serialize(context) })),
  warn: (event, context = {}) => console.warn(JSON.stringify({ level: 'warn', event, ...serialize(context) })),
  error: (event, context = {}) => console.error(JSON.stringify({ level: 'error', event, ...serialize(context) })),
};
