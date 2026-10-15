import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Trips API - Pagination and Search Endpoints', () => {
  test('GET /api/trips supports pagination parameters and returns envelope metadata', async () => {
    const response = await request(app).get('/api/trips?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');

    const { pagination, data } = response.body;
    expect(data.length).toBeLessThanOrEqual(2);
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(2);
    expect(pagination).toHaveProperty('totalItems');
    expect(pagination).toHaveProperty('totalPages');
    expect(pagination).toHaveProperty('hasNextPage');
    expect(pagination).toHaveProperty('hasPreviousPage');
  });

  test('GET /api/trips filters trips by region or season', async () => {
    // Testing region filter
    const response = await request(app).get('/api/trips?region=central');

    expect(response.status).toBe(200);
    const trips = response.body.data || response.body;
    expect(Array.isArray(trips)).toBe(true);

    if (trips.length > 0) {
      trips.forEach((trip) => {
        expect(trip.region.toLowerCase()).toBe('central');
      });
    }
  });

  test('GET /api/trips searches trips by keyword', async () => {
    const response = await request(app).get('/api/trips?q=tokyo');

    expect(response.status).toBe(200);
    const trips = response.body.data || response.body;

    if (trips.length > 0) {
      trips.forEach((trip) => {
        const matchesName = trip.name.toLowerCase().includes('tokyo');
        const matchesDesc = trip.description && trip.description.toLowerCase().includes('tokyo');
        expect(matchesName || matchesDesc).toBe(true);
      });
    }
  });

  test('GET /api/trips returns 200 with empty data array when no records match filter', async () => {
    const response = await request(app).get('/api/trips?q=nonexistentqueryxyz999');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    if (response.body.pagination) {
      expect(response.body.pagination.totalItems).toBe(0);
    }
  });

  test('GET /api/trips returns 400 for invalid page or limit query values', async () => {
    const response = await request(app).get('/api/trips?page=-1');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});