import { beforeEach, describe, expect, test } from 'vitest';
import app from '../app.js';
import { createTestUser, loginAsTestUser } from './helpers/auth.js';

const CUSTOMERS = [
  { displayName: 'Haruto Sato', username: 'haruto-sato', email: 'haruto.sato@example.com' },
  { displayName: 'Yuki Tanaka', username: 'yuki-tanaka', email: 'yuki.tanaka@example.com' },
  { displayName: 'Kenji Watanabe', username: 'kenji-watanabe', email: 'kenji.watanabe@example.com' },
  { displayName: 'Aiko Suzuki', username: 'aiko-suzuki', email: 'aiko.suzuki@example.com' },
  { displayName: 'Ren Kobayashi', username: 'ren-kobayashi', email: 'ren.kobayashi@example.com' }
];

let adminAgent;
let adminPassword;

beforeEach(async () => {
  const admin = await createTestUser({
    role: 'admin',
    displayName: 'Admin User',
    username: 'admin-user',
    email: 'admin-user@example.com'
  });
  adminPassword = admin.password;

  for (const customer of CUSTOMERS) {
    await createTestUser({ role: 'customer', ...customer });
  }

  adminAgent = await loginAsTestUser(app, { email: 'admin-user@example.com', password: adminPassword });
});

describe('GET /api/users pagination', () => {
  test('returns the first page with default pagination metadata', async () => {
    const response = await adminAgent.get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(6); // 5 customers + 1 admin
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 6,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
  });

  test('returns a page with fewer than the maximum number of results', async () => {
    const response = await adminAgent.get('/api/users').query({ page: 2, limit: 4 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2); // 6 total, page 2 of 4-per-page has only 2
    expect(response.body.pagination).toMatchObject({
      page: 2,
      limit: 4,
      totalItems: 6,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true
    });
  });

  test('rejects an invalid page parameter', async () => {
    const response = await adminAgent.get('/api/users').query({ page: 'not-a-number' });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/users role filter', () => {
  test('returns only users with the matching role', async () => {
    const response = await adminAgent.get('/api/users').query({ role: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      displayName: 'Admin User',
      role: 'admin'
    });
    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('returns no matches for a role that does not exist', async () => {
    const response = await adminAgent.get('/api/users').query({ role: 'superadmin' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.pagination.totalItems).toBe(0);
  });
});

describe('GET /api/users keyword search', () => {
  test('matches a keyword in displayName, username, or email', async () => {
    const response = await adminAgent.get('/api/users').query({ q: 'kobayashi' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].displayName).toBe('Ren Kobayashi');
  });

  test('search is case-insensitive', async () => {
    const response = await adminAgent.get('/api/users').query({ q: 'YUKI' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].displayName).toBe('Yuki Tanaka');
  });

  test('returns no matches for an unmatched keyword', async () => {
    const response = await adminAgent.get('/api/users').query({ q: 'nonexistent-keyword-zzz' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.pagination.totalItems).toBe(0);
  });
});