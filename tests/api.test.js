import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.APP_API_KEY = 'test-api-key-for-mini-calls';
const { default: app } = await import('../src/app.js');
const { prisma } = await import('../src/lib/prisma.js');

after(async () => { await prisma.$disconnect(); });

test('health endpoint is public and responds successfully', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('readiness endpoint verifies the PostgreSQL connection', { skip: !process.env.DATABASE_URL }, async () => {
  const response = await request(app).get('/api/health/ready');
  assert.equal(response.status, 200);
  assert.equal(response.body.database, 'connected');
});

test('application API rejects missing API keys', async () => {
  const response = await request(app).get('/api/calls');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'UNAUTHORIZED');
});

test('application API rejects invalid API keys', async () => {
  const response = await request(app).get('/api/messages').set('x-api-key', 'wrong');
  assert.equal(response.status, 401);
});

test('outbound call endpoint validates E.164 numbers before touching providers', async () => {
  const response = await request(app).post('/api/calls')
    .set('x-api-key', process.env.APP_API_KEY)
    .send({ to: '5551234567' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'VALIDATION_ERROR');
});

test('outbound call endpoint enforces its per-IP hourly limit', async () => {
  const statuses = [];
  for (let i = 0; i < 11; i += 1) {
    const response = await request(app).post('/api/calls')
      .set('x-api-key', process.env.APP_API_KEY)
      .set('x-forwarded-for', '198.51.100.99')
      .send({ to: '5551234567' });
    statuses.push(response.status);
  }
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(400));
  assert.equal(statuses[10], 429);
});

test('canonical thread endpoint validates its phone parameter', async () => {
  const response = await request(app).get('/api/threads/not-a-number')
    .set('x-api-key', process.env.APP_API_KEY);
  assert.equal(response.status, 400);
});
