import { beforeEach, describe, expect, test } from 'vitest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { createTestUser, loginAsTestUser } from './helpers/auth.js';

const ADMIN_EMAIL = 'bookings-pagination-admin@example.com';

const BOOKINGS = [
  { id: 'booking-001', ticketClass: 'standard', createdAt: '2026-01-10' },
  { id: 'booking-002', ticketClass: 'first', createdAt: '2026-01-11' },
  { id: 'booking-003', ticketClass: 'premium', createdAt: '2026-01-12' },
  { id: 'booking-004', ticketClass: 'first', createdAt: '2026-01-13' },
  { id: 'booking-005', ticketClass: 'standard', createdAt: '2026-01-14' },
  { id: 'booking-006', ticketClass: 'first', createdAt: '2026-01-15' }
];

let adminAgent;

beforeEach(async () => {
  const admin = await createTestUser({
    role: 'admin',
    displayName: 'Bookings Pagination Admin',
    username: 'bookings-pagination-admin',
    email: ADMIN_EMAIL
  });

  adminAgent = await loginAsTestUser(app, {
    email: ADMIN_EMAIL,
    password: admin.password
  });

  const documents = BOOKINGS.map((booking) => {
    const createdAt = new Date(`${booking.createdAt}T12:00:00.000Z`);

    return {
      id: booking.id,
      scheduleId: 1,
      tripId: 'alpine-panorama',
      ticketClass: booking.ticketClass,
      selectedDay: booking.createdAt,
      passengers: [
        {
          firstName: 'Test',
          lastName: 'Passenger',
          email: 'passenger@example.com',
          phone: '09123456789'
        }
      ],
      createdAt,
      updatedAt: createdAt
    };
  });

  await getDb().collection('bookings').insertMany(documents);
});

describe('GET /api/bookings pagination', () => {
  test('returns the first page with default pagination metadata', async () => {
    const response = await adminAgent.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(6);

    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 6,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
  });

  test('returns different records across multiple pages', async () => {
    const firstPage = await adminAgent
      .get('/api/bookings')
      .query({ page: 1, limit: 2 });

    const secondPage = await adminAgent
      .get('/api/bookings')
      .query({ page: 2, limit: 2 });

    expect(firstPage.status).toBe(200);
    expect(secondPage.status).toBe(200);

    expect(firstPage.body.bookings.map((booking) => booking.id)).toEqual([
      'booking-006',
      'booking-005'
    ]);

    expect(secondPage.body.bookings.map((booking) => booking.id)).toEqual([
      'booking-004',
      'booking-003'
    ]);

    expect(firstPage.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      totalItems: 6,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false
    });

    expect(secondPage.body.pagination).toMatchObject({
      page: 2,
      limit: 2,
      totalItems: 6,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true
    });
  });

  test('returns a partially filled page and correct metadata', async () => {
    const response = await adminAgent
      .get('/api/bookings')
      .query({ page: 2, limit: 4 });

    expect(response.status).toBe(200);

    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'booking-002',
      'booking-001'
    ]);

    expect(response.body.pagination).toMatchObject({
      page: 2,
      limit: 4,
      totalItems: 6,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true
    });
  });
});

describe('GET /api/bookings ticket-class filter', () => {
  test('returns only bookings with the requested ticket class', async () => {
    const response = await adminAgent
      .get('/api/bookings')
      .query({ ticketClass: 'first' });

    expect(response.status).toBe(200);

    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'booking-006',
      'booking-004',
      'booking-002'
    ]);

    expect(
      response.body.bookings.every((booking) => booking.ticketClass === 'first')
    ).toBe(true);

    expect(response.body.pagination).toMatchObject({
      totalItems: 3,
      totalPages: 1
    });
  });
});

describe('GET /api/bookings booking-date filter', () => {
  test('returns bookings within the inclusive date range', async () => {
    const response = await adminAgent
      .get('/api/bookings')
      .query({
        startDate: '2026-01-12',
        endDate: '2026-01-14'
      });

    expect(response.status).toBe(200);

    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'booking-005',
      'booking-004',
      'booking-003'
    ]);

    expect(response.body.pagination).toMatchObject({
      totalItems: 3,
      totalPages: 1
    });
  });

  test('combines ticket-class and booking-date filters', async () => {
    const response = await adminAgent
      .get('/api/bookings')
      .query({
        ticketClass: 'first',
        startDate: '2026-01-12',
        endDate: '2026-01-14'
      });

    expect(response.status).toBe(200);

    expect(response.body.bookings.map((booking) => booking.id)).toEqual([
      'booking-004'
    ]);

    expect(response.body.pagination).toMatchObject({
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
  });

  test('returns no matches with valid empty-result pagination metadata', async () => {
    const response = await adminAgent
      .get('/api/bookings')
      .query({
        ticketClass: 'first',
        startDate: '2030-01-01',
        endDate: '2030-01-31'
      });

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([]);

    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
  });
});

describe('GET /api/bookings filter validation', () => {
  test('rejects an invalid ticket class', async () => {
    const response = await adminAgent
      .get('/api/bookings')
      .query({ ticketClass: 'economy' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid ticketClass parameter');
  });

  test('rejects an invalid booking date', async () => {
    const response = await adminAgent
      .get('/api/bookings')
      .query({ startDate: '2026-02-30' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'startDate must be a valid YYYY-MM-DD date'
    );
  });
});