import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Booking from '../src/models/schemas/bookings.js';
import { createTestUser, loginAsTestUser } from './helpers/auth.js';

const createTestBooking = async (id, passengerEmail) => {
  return Booking.create({
    id,
    scheduleId: 1,
    tripId: 'alpine-panorama',
    ticketClass: 'standard',
    selectedDay: '2026-10-20',
    passengers: [
      {
        firstName: 'Test',
        lastName: 'Passenger',
        email: passengerEmail,
        phone: '09123456789'
      }
    ]
  });
};

describe('GET /api/bookings', () => {
  test('returns 401 when the user is not authenticated', async () => {
    const response = await request(app).get('/api/bookings');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  test('allows an admin to see all bookings', async () => {
    const { user, password } = await createTestUser({
      role: 'admin',
      username: 'admin-test',
      email: 'admin-test@example.com'
    });

    await createTestBooking('booking-admin-1', 'customer-one@example.com');
    await createTestBooking('booking-admin-2', 'customer-two@example.com');

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(2);
    expect(response.body.pagination.totalItems).toBe(2);
    expect(response.body.bookings.map((booking) => booking.id))
      .toEqual(expect.arrayContaining([
        'booking-admin-1',
        'booking-admin-2'
      ]));
  });

  test('allows a customer to see only bookings containing their email', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'customer-test',
      email: 'customer-test@example.com'
    });

    await createTestBooking('booking-customer-own', user.email);
    await createTestBooking('booking-customer-other', 'other@example.com');

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(1);
    expect(response.body.bookings[0].id).toBe('booking-customer-own');
    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('returns the expected list and pagination structure', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'structure-test',
      email: 'structure-test@example.com'
    });

    await createTestBooking('booking-structure', user.email);

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bookings');
    expect(response.body).toHaveProperty('pagination');

    expect(response.body.bookings[0]).toMatchObject({
      id: 'booking-structure',
      scheduleId: 1,
      tripId: 'alpine-panorama',
      ticketClass: 'standard',
      passengers: [
        expect.objectContaining({
          email: user.email
        })
      ]
    });

    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    });
  });

  describe('GET /api/bookings/:id', () => {
    test('returns 401 when the user is not authenticated', async () => {
      const response = await request(app)
        .get('/api/bookings/booking-detail');

      expect(response.status).toBe(401);
    });

    test('allows an admin to retrieve any booking', async () => {
      const { user, password } = await createTestUser({
        role: 'admin',
        username: 'booking-detail-admin',
        email: 'booking-detail-admin@example.com'
      });

      await createTestBooking(
        'booking-detail-admin-test',
        'customer@example.com'
      );

      const agent = await loginAsTestUser(app, {
        email: user.email,
        password
      });

      const response = await agent
        .get('/api/bookings/booking-detail-admin-test');

      expect(response.status).toBe(200);
      expect(response.body.booking.id).toBe('booking-detail-admin-test');
      expect(response.body.booking.passengers[0].email)
        .toBe('customer@example.com');
    });

    test('allows a customer to retrieve their own booking', async () => {
      const { user, password } = await createTestUser({
        role: 'customer',
        username: 'booking-detail-customer',
        email: 'booking-detail-customer@example.com'
      });

      await createTestBooking(
        'booking-detail-own',
        user.email
      );

      const agent = await loginAsTestUser(app, {
        email: user.email,
        password
      });

      const response = await agent
        .get('/api/bookings/booking-detail-own');

      expect(response.status).toBe(200);
      expect(response.body.booking.id).toBe('booking-detail-own');
    });

    test('forbids a customer from retrieving another customer booking', async () => {
      const { user, password } = await createTestUser({
        role: 'customer',
        username: 'booking-detail-outsider',
        email: 'booking-detail-outsider@example.com'
      });

      await createTestBooking(
        'booking-detail-private',
        'another-customer@example.com'
      );

      const agent = await loginAsTestUser(app, {
        email: user.email,
        password
      });

      const response = await agent
        .get('/api/bookings/booking-detail-private');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    test('returns 404 when the booking does not exist', async () => {
      const { user, password } = await createTestUser({
        role: 'customer',
        username: 'booking-detail-missing',
        email: 'booking-detail-missing@example.com'
      });

      const agent = await loginAsTestUser(app, {
        email: user.email,
        password
      });

      const response = await agent
        .get('/api/bookings/nonexistent-booking');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Booking not found');
    });
  });
});