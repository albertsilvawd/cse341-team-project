import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('Trips API - Read Endpoints', () => {
  test('GET /api/trips returns status 200 and an array of trips', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);

    // Handles both raw array and pagination wrapper format { data: [...] }
    const trips = Array.isArray(response.body) ? response.body : response.body.data;
    expect(Array.isArray(trips)).toBe(true);
    expect(trips.length).toBeGreaterThan(0);
  });

  test('GET /api/trips contains known seeded trip data', async () => {
    const response = await request(app).get('/api/trips');
    expect(response.status).toBe(200);

    const trips = Array.isArray(response.body) ? response.body : response.body.data;
    const sampleTrip = trips[0];

    expect(sampleTrip).toHaveProperty('id');
    expect(sampleTrip).toHaveProperty('name');
   
  });

  test('GET /api/trips/:id returns 200 and the correct trip', async () => {
    const db = getDb();
    const seededTrip = await db.collection('trips').findOne({});
    expect(seededTrip).not.toBeNull();

    const response = await request(app).get(`/api/trips/${seededTrip.id}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.id).toBe(seededTrip.id);
    expect(response.body.name).toBe(seededTrip.name);
  });

  test('GET /api/trips/:id returns 404 for a non-existent trip ID', async () => {
    const response = await request(app).get('/api/trips/non-existent-trip-99999');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('error');
  });
});