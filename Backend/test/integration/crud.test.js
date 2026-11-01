import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import app from '../../src/app.js';
import { User } from '../../src/models/user.model.js';
import { Post } from '../../src/models/post.model.js';
import { Session } from '../../src/models/session.model.js';

// A random database name prevents touching the application database.
test('MongoDB: registration, login, ownership, post CRUD and token revocation', { skip: !process.env.TEST_MONGODB_URI }, async () => {
  let server;
  try {
    await mongoose.connect(process.env.TEST_MONGODB_URI, { dbName: `tutorial_test_${randomUUID().replaceAll('-', '')}`, serverSelectionTimeoutMS: 10000 });
    await Promise.all([User.init(), Post.init(), Session.init()]);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(method, path, body, expected, token) {
      const response = await fetch(base + '/api/v1' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) });
      const data = await response.json();
      assert.equal(response.status, expected, JSON.stringify(data));
      return data;
    }
    const user = { username: 'Student', email: 'student@example.com', password: 'Test-password-123' };
    const registered = await request('POST', '/users/register', user, 201);
    assert.equal(registered.user.password, undefined);
    await request('POST', '/users/register', user, 409);
    await request('POST', '/users/login', { ...user, password: 'wrong-password' }, 401);
    const { token } = await request('POST', '/users/login', user, 200);
    const created = await request('POST', '/posts/create', { title: 'First', content: 'Hello' }, 201, token);
    const id = created.post._id;
    const stored = await User.findOne({ email: user.email }).select('+password');
    assert.notEqual(stored.password, user.password);
    await request('GET', `/posts/${id}`, undefined, 200);
    const listed = await request('GET', '/posts/getPosts', undefined, 200);
    assert.equal(listed.posts.length, 1);
    await request('PATCH', `/posts/update/${id}`, {}, 400, token);
    const updated = await request('PATCH', `/posts/update/${id}`, { title: 'Updated', author: '507f1f77bcf86cd799439011' }, 200, token);
    assert.equal(updated.post.title, 'Updated');
    assert.equal(updated.post.author, registered.user.id);
    const other = { ...user, email: 'other@example.com' };
    await request('POST', '/users/register', other, 201);
    const otherLogin = await request('POST', '/users/login', other, 200);
    await request('DELETE', `/posts/${id}`, undefined, 403, otherLogin.token);
    await request('DELETE', `/posts/delete/${id}`, undefined, 200, token);
    await request('GET', `/posts/${id}`, undefined, 404);
    await request('POST', '/users/logout', {}, 200, token);
    await request('POST', '/posts/create', { title: 'Denied', content: 'Logged out' }, 401, token);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
