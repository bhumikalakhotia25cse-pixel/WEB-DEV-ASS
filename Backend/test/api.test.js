import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Post } from '../src/models/post.model.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';
import connectDB from '../src/config/database.js';

let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

test('passwords are salted and verified without plaintext storage', async () => {
  const first = await hashPassword('test-password');
  const second = await hashPassword('test-password');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('test-password', first), true);
  assert.equal(await verifyPassword('incorrect', first), false);
});
test('Mongoose models validate required fields, email and post lengths', async () => {
  await assert.rejects(new User({ username: 'A', email: 'bad', password: 'hash' }).validate());
  await assert.rejects(new Post({ title: '', content: 'text' }).validate());
  await assert.rejects(new Post({ title: 'x'.repeat(201), content: 'text', author: '507f1f77bcf86cd799439011' }).validate());
  assert.equal(new User({ username: 'Student', email: 'STUDENT@example.com', password: 'hash' }).email, 'student@example.com');
});
test('password is excluded even when serializing a user with password loaded', () => {
  assert.equal(new User({ username: 'Student', email: 's@example.com', password: 'secret' }).toJSON().password, undefined);
});
test('missing and placeholder database configuration fail before connection', async () => {
  await assert.rejects(connectDB(''), /Set MONGODB_URI/);
  await assert.rejects(connectDB('mongodb+srv://user:<password>@host/db'), /Set MONGODB_URI/);
});
test('HTTP validation and route handling work without a database', async () => {
  const cases = [
    ['GET', '/health', undefined, 503],
    ['GET', '/missing', undefined, 404],
    ['POST', '/api/v1/users/register', {}, 400],
    ['POST', '/api/v1/users/register', { username: 'A', email: 'a@example.com', password: 'short' }, 400],
    ['POST', '/api/v1/users/login', { email: { $ne: null }, password: 'password' }, 400],
    ['POST', '/api/v1/posts/create', { title: 'Hi', content: 'Text' }, 401],
    ['POST', '/api/v1/users/logout', {}, 401],
    ['GET', '/api/v1/posts/bad-id', undefined, 400],
  ];
  for (const [method, path, body, status] of cases) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    assert.equal(response.status, status, `${method} ${path}`);
    assert.ok((await response.json()).message || path === '/health');
  }
  const response = await fetch(base + '/api/v1/users/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'Invalid JSON body');
});
