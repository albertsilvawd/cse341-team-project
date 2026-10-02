import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('trains');
    expect(response.body.trains).toBeInstanceOf(Array);
  });

  test('returns the trains from the starter data', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(4);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          name: 'Series E353 Limited Express',
          powerSource: 'Electric'
        })
      ])
    );
  });

  test('returns a train added to the test database', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express'
        })
      ])
    );
  });

  test('returns paginated results and metadata', async () => {
    const response = await request(app).get('/api/trains?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(2);
    expect(response.body.metadata).toEqual({
      page: 1,
      limit: 2,
      total: 4,
      totalPages: 2
    });
  });

  test('returns the second page of results', async () => {
    const response = await request(app).get('/api/trains?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(2);
    expect(response.body.metadata).toEqual({
      page: 2,
      limit: 2,
      total: 4,
      totalPages: 2
    });
  });

  test('rejects an invalid page value', async () => {
    const response = await request(app).get('/api/trains?page=0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'page must be a positive integer'
    });
  });

  test('rejects an invalid limit value', async () => {
    const response = await request(app).get('/api/trains?limit=0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'limit must be a positive integer'
    });
  });
});