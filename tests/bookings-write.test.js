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

describe('PUT /api/bookings/:id', () => {
  test('returns 401 when the user is not authenticated', async () => {
    const response = await request(app)
      .put('/api/bookings/nonexistent-booking')
      .send({ ticketClass: 'premium' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  test('allows a customer to update their own booking', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'booking-owner',
      email: 'owner@example.com'
    });

    const booking = await createTestBooking(
      'update-owned-booking',
      user.email
    );

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent
      .put(`/api/bookings/${booking.id}`)
      .send({ ticketClass: 'premium' });

    expect(response.status).toBe(200);
    expect(response.body.booking.ticketClass).toBe('premium');

    const updatedBooking = await Booking.findOne({ id: booking.id });
    expect(updatedBooking.ticketClass).toBe('premium');
  });

  test('rejects an invalid ticket class', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'invalid-class-user',
      email: 'invalid-class@example.com'
    });

    const booking = await createTestBooking(
      'invalid-class-booking',
      user.email
    );

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent
      .put(`/api/bookings/${booking.id}`)
      .send({ ticketClass: 'luxury' });

    expect(response.status).toBe(400);

    const unchangedBooking = await Booking.findOne({ id: booking.id });
    expect(unchangedBooking.ticketClass).toBe('standard');
  });

  test('returns 404 when the booking does not exist', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'missing-update-user',
      email: 'missing-update@example.com'
    });

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent
      .put('/api/bookings/missing-update-booking')
      .send({ ticketClass: 'premium' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Booking not found');
  });

  test('forbids a customer from updating another customer booking', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'other-customer',
      email: 'other@example.com'
    });

    const booking = await createTestBooking(
      'another-customers-update',
      'owner@example.com'
    );

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent
      .put(`/api/bookings/${booking.id}`)
      .send({ ticketClass: 'premium' });

    expect(response.status).toBe(403);

    const unchangedBooking = await Booking.findOne({ id: booking.id });
    expect(unchangedBooking.ticketClass).toBe('standard');
  });

  test('allows an admin to update another customer booking', async () => {
    const { user, password } = await createTestUser({
      role: 'admin',
      username: 'booking-admin',
      email: 'admin@example.com'
    });

    const booking = await createTestBooking(
      'admin-update-booking',
      'owner@example.com'
    );

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent
      .put(`/api/bookings/${booking.id}`)
      .send({ ticketClass: 'first' });

    expect(response.status).toBe(200);

    const updatedBooking = await Booking.findOne({ id: booking.id });
    expect(updatedBooking.ticketClass).toBe('first');
  });
});

describe('DELETE /api/bookings/:id', () => {
  test('returns 401 when the user is not authenticated', async () => {
    const response = await request(app)
      .delete('/api/bookings/nonexistent-booking');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  test('allows a customer to delete their own booking', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'booking-delete-owner',
      email: 'delete-owner@example.com'
    });

    const booking = await createTestBooking(
      'delete-owned-booking',
      user.email
    );

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent.delete(`/api/bookings/${booking.id}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Booking deleted successfully');

    const deletedBooking = await Booking.findOne({ id: booking.id });
    expect(deletedBooking).toBeNull();
  });

  test('returns 404 when the booking does not exist', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'missing-delete-user',
      email: 'missing-delete@example.com'
    });

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent.delete(
      '/api/bookings/missing-delete-booking'
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Booking not found');
  });

  test('forbids a customer from deleting another customer booking', async () => {
    const { user, password } = await createTestUser({
      role: 'customer',
      username: 'delete-other-customer',
      email: 'delete-other@example.com'
    });

    const booking = await createTestBooking(
      'another-customers-delete',
      'owner@example.com'
    );

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent.delete(`/api/bookings/${booking.id}`);

    expect(response.status).toBe(403);

    const existingBooking = await Booking.findOne({ id: booking.id });
    expect(existingBooking).not.toBeNull();
  });

  test('allows an admin to delete another customer booking', async () => {
    const { user, password } = await createTestUser({
      role: 'admin',
      username: 'booking-delete-admin',
      email: 'delete-admin@example.com'
    });

    const booking = await createTestBooking(
      'admin-delete-booking',
      'owner@example.com'
    );

    const agent = await loginAsTestUser(app, {
      email: user.email,
      password
    });

    const response = await agent.delete(`/api/bookings/${booking.id}`);

    expect(response.status).toBe(200);

    const deletedBooking = await Booking.findOne({ id: booking.id });
    expect(deletedBooking).toBeNull();
  });
});