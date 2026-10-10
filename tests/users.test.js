import { describe, expect, test } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { createTestUser, loginAsTestUser } from './helpers/auth.js';

describe('GET /api/users', () => {
  test('rejects a request with no signed-in user', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
  });

  test('rejects a standard signed-in user', async () => {
    const { password } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });
    const agent = await loginAsTestUser(app, { email: 'regular-rider@example.com', password });

    const response = await agent.get('/api/users');

    expect(response.status).toBe(403);
  });

  test('returns every user for an administrator, without password hashes', async () => {
    const { password: adminPassword } = await createTestUser({
      role: 'admin',
      displayName: 'Admin User',
      username: 'admin-user',
      email: 'admin-user@example.com'
    });
    await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });

    const adminAgent = await loginAsTestUser(app, { email: 'admin-user@example.com', password: adminPassword });

    const response = await adminAgent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          displayName: 'Admin User',
          username: 'admin-user',
          email: 'admin-user@example.com',
          role: 'admin'
        }),
        expect.objectContaining({
          displayName: 'Regular Rider',
          username: 'regular-rider',
          email: 'regular-rider@example.com',
          role: 'customer'
        })
      ])
    );

    for (const user of response.body.data) {
      expect(user).not.toHaveProperty('passwordHash');
    }
  });
});

describe('GET /api/users/:id', () => {
  test('rejects a request with no signed-in user', async () => {
    const { user } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });

    const response = await request(app).get(`/api/users/${user._id.toString()}`);

    expect(response.status).toBe(401);
  });

  test('allows a standard user to view their own record', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });
    const agent = await loginAsTestUser(app, { email: 'regular-rider@example.com', password });

    const response = await agent.get(`/api/users/${user._id.toString()}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com',
      role: 'customer'
    });
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  test('forbids a standard user from viewing a different user\'s record', async () => {
    const { user: otherUser } = await createTestUser({
      role: 'customer',
      displayName: 'Other Rider',
      username: 'other-rider',
      email: 'other-rider@example.com'
    });
    const { password } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });
    const agent = await loginAsTestUser(app, { email: 'regular-rider@example.com', password });

    const response = await agent.get(`/api/users/${otherUser._id.toString()}`);

    expect(response.status).toBe(403);
  });

  test('allows an administrator to view any user\'s record', async () => {
    const { user: otherUser } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });
    const { password: adminPassword } = await createTestUser({
      role: 'admin',
      displayName: 'Admin User',
      username: 'admin-user',
      email: 'admin-user@example.com'
    });
    const adminAgent = await loginAsTestUser(app, { email: 'admin-user@example.com', password: adminPassword });

    const response = await adminAgent.get(`/api/users/${otherUser._id.toString()}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('regular-rider@example.com');
  });

  test('returns 404 for an id that does not exist', async () => {
    const { password: adminPassword } = await createTestUser({
      role: 'admin',
      displayName: 'Admin User',
      username: 'admin-user',
      email: 'admin-user@example.com'
    });
    const adminAgent = await loginAsTestUser(app, { email: 'admin-user@example.com', password: adminPassword });

    const missingId = new mongoose.Types.ObjectId().toString();

    const response = await adminAgent.get(`/api/users/${missingId}`);

    expect(response.status).toBe(404);
  });
});