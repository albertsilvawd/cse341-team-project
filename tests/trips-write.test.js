import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { createTestUser, loginAsTestUser } from './helpers/auth.js';

describe('Trips API - Write Endpoints', () => {
  async function getAdminAgent() {
    const unique = Date.now();
    const { user, password } = await createTestUser({
      role: 'admin',
      displayName: 'Admin Tester',
      username: `adm_${unique}`,
      email: `admin_${unique}@test.com`
    });

    return loginAsTestUser(app, { email: user.email, password });
  }

  test('PUT /api/trips/:id rejects unauthenticated access with 401 or 403', async () => {
    const db = getDb();
    const trip = await db.collection('trips').findOne({});
    expect(trip).not.toBeNull();

    const response = await request(app)
      .put(`/api/trips/${trip.id}`)
      .send({ name: 'Unauthorized Name' });

    expect([401, 403]).toContain(response.status);
  });

  test('PUT /api/trips/:id allows admin to update a trip and updates database', async () => {
    const adminAgent = await getAdminAgent();
    const db = getDb();
    const trip = await db.collection('trips').findOne({});
    expect(trip).not.toBeNull();

    const updatedData = {
      name: 'Super Express Update'
    };

    const response = await adminAgent
      .put(`/api/trips/${trip.id}`)
      .send(updatedData);

    expect(response.status).toBe(200);

    // Verify in database directly
    const modifiedTrip = await db.collection('trips').findOne({ id: trip.id });
    expect(modifiedTrip.name).toBe(updatedData.name);
  });

  test('DELETE /api/trips/:id rejects unauthenticated user with 401 or 403', async () => {
    const db = getDb();
    const trip = await db.collection('trips').findOne({});
    expect(trip).not.toBeNull();

    const response = await request(app).delete(`/api/trips/${trip.id}`);

    expect([401, 403]).toContain(response.status);
  });

  test('DELETE /api/trips/:id allows admin to delete a trip and removes from database', async () => {
    const adminAgent = await getAdminAgent();
    const db = getDb();
    const trip = await db.collection('trips').findOne({});
    expect(trip).not.toBeNull();

    const response = await adminAgent.delete(`/api/trips/${trip.id}`);

    expect([200, 204]).toContain(response.status);

    // Verify record no longer exists in database
    const deletedTrip = await db.collection('trips').findOne({ id: trip.id });
    expect(deletedTrip).toBeNull();
  });
});