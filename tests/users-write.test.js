import { describe, expect, test } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../src/models/schemas/users.js';
import { createTestUser, loginAsTestUser } from './helpers/auth.js';

describe('POST /register', () => {
  test('creates a new user with a hashed password and the default customer role', async () => {
    const response = await request(app).post('/register').type('form').send({
      displayName: 'New Rider',
      username: 'new-rider',
      email: 'new-rider@example.com',
      password: 'Password123!'
    });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login?registered=true');

    const savedUser = await User.findOne({ email: 'new-rider@example.com' }).populate('role');

    expect(savedUser).not.toBeNull();
    expect(savedUser.displayName).toBe('New Rider');
    expect(savedUser.username).toBe('new-rider');
    expect(savedUser.role.name).toBe('customer');
    expect(savedUser.passwordHash).not.toBe('Password123!');
  });

  test('rejects registration when required fields are missing', async () => {
    const response = await request(app).post('/register').type('form').send({
      displayName: 'Incomplete Rider',
      email: 'incomplete-rider@example.com'
      // username and password are missing
    });

    expect(response.status).toBe(400);

    const savedUser = await User.findOne({ email: 'incomplete-rider@example.com' });

    expect(savedUser).toBeNull();
  });

  test('rejects registration with a duplicate email', async () => {
    await createTestUser({
      role: 'customer',
      displayName: 'Existing Rider',
      username: 'existing-rider',
      email: 'duplicate@example.com'
    });

    const response = await request(app).post('/register').type('form').send({
      displayName: 'Another Rider',
      username: 'another-rider',
      email: 'duplicate@example.com',
      password: 'Password123!'
    });

    expect(response.status).toBe(409);

    const matchingUsers = await User.find({ email: 'duplicate@example.com' });

    expect(matchingUsers).toHaveLength(1);
  });
});

describe('PUT /api/users/:id', () => {
  test('rejects a request with no signed-in user', async () => {
    const { user } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });

    const response = await request(app)
      .put(`/api/users/${user._id.toString()}`)
      .send({ displayName: 'New Name' });

    expect(response.status).toBe(401);
  });

  test('allows a standard user to update their own displayName', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });
    const agent = await loginAsTestUser(app, { email: 'regular-rider@example.com', password });

    const response = await agent
      .put(`/api/users/${user._id.toString()}`)
      .send({ displayName: 'Updated Name' });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe('Updated Name');

    const savedUser = await User.findById(user._id);

    expect(savedUser.displayName).toBe('Updated Name');
  });

  test("forbids a standard user from updating someone else's record", async () => {
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

    const response = await agent
      .put(`/api/users/${otherUser._id.toString()}`)
      .send({ displayName: 'Hacked Name' });

    expect(response.status).toBe(403);

    const savedUser = await User.findById(otherUser._id);

    expect(savedUser.displayName).toBe('Other Rider');
  });

  test('forbids a standard user from changing their own role', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });
    const agent = await loginAsTestUser(app, { email: 'regular-rider@example.com', password });

    const response = await agent
      .put(`/api/users/${user._id.toString()}`)
      .send({ role: 'admin' });

    expect(response.status).toBe(403);

    const savedUser = await User.findById(user._id).populate('role');

    expect(savedUser.role.name).toBe('customer');
  });

  test("allows an administrator to update another user's role", async () => {
    const { user: targetUser } = await createTestUser({
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

    const response = await adminAgent
      .put(`/api/users/${targetUser._id.toString()}`)
      .send({ role: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('admin');

    const savedUser = await User.findById(targetUser._id).populate('role');

    expect(savedUser.role.name).toBe('admin');
  });

  test('rejects an invalid role name', async () => {
    const { user, password: adminPassword } = await createTestUser({
      role: 'admin',
      displayName: 'Admin User',
      username: 'admin-user',
      email: 'admin-user@example.com'
    });
    const adminAgent = await loginAsTestUser(app, { email: 'admin-user@example.com', password: adminPassword });

    const response = await adminAgent
      .put(`/api/users/${user._id.toString()}`)
      .send({ role: 'superadmin' });

    expect(response.status).toBe(400);
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

    const response = await adminAgent
      .put(`/api/users/${missingId}`)
      .send({ displayName: 'Ghost' });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/users/:id', () => {
  test('rejects a request with no signed-in user', async () => {
    const { user } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });

    const response = await request(app).delete(`/api/users/${user._id.toString()}`);

    expect(response.status).toBe(401);
  });

  test('allows a standard user to delete their own account', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      displayName: 'Regular Rider',
      username: 'regular-rider',
      email: 'regular-rider@example.com'
    });
    const agent = await loginAsTestUser(app, { email: 'regular-rider@example.com', password });

    const response = await agent.delete(`/api/users/${user._id.toString()}`);

    expect(response.status).toBe(200);

    const savedUser = await User.findById(user._id);

    expect(savedUser).toBeNull();
  });

  test("forbids a standard user from deleting someone else's account", async () => {
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

    const response = await agent.delete(`/api/users/${otherUser._id.toString()}`);

    expect(response.status).toBe(403);

    const savedUser = await User.findById(otherUser._id);

    expect(savedUser).not.toBeNull();
  });

  test("allows an administrator to delete another user's account", async () => {
    const { user: targetUser } = await createTestUser({
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

    const response = await adminAgent.delete(`/api/users/${targetUser._id.toString()}`);

    expect(response.status).toBe(200);

    const savedUser = await User.findById(targetUser._id);

    expect(savedUser).toBeNull();
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

    const response = await adminAgent.delete(`/api/users/${missingId}`);

    expect(response.status).toBe(404);
  });
});