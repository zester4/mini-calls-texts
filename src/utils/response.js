export function success(res, data, status = 200) {
  res.status(status).json(data);
}

export function error(res, message, status = 400) {
  res.status(status).json({ error: message });
}
