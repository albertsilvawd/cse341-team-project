import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import {
  createBooking,
  getBookingById,
  updateBooking,
  deleteBooking,
  getPaginatedBookings
} from '../models/bookings.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const parsePaginationParams = (query) => {
  const rawPage = query.page;
  const rawLimit = query.limit;

  const page = rawPage === undefined ? DEFAULT_PAGE : Number(rawPage);
  const limit = rawLimit === undefined ? DEFAULT_LIMIT : Number(rawLimit);

  if (!Number.isInteger(page) || page < 1) {
    return { error: 'page must be a positive integer' };
  }

  if (!Number.isInteger(limit) || limit < 1) {
    return { error: 'limit must be a positive integer' };
  }

  return { page, limit: Math.min(limit, MAX_LIMIT) };
};

const canAccessBooking = (booking, user) => {
  if (user.role === 'admin') {
    return true;
  }

  return booking.passengers.some(
    (passenger) => passenger.email === user.email
  );
};

const bookingPage = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;

    const db = getDb();

    const schedule = await db.collection('schedules').findOne({
      id: Number(scheduleId)
    });

    if (!schedule) {
      return res.status(404).render('errors/404', {
        title: 'Schedule Not Found'
      });
    }

    const trip = await db.collection('trips').findOne({
      id: schedule.tripId
    });

    if (!trip) {
      return res.status(404).render('errors/404', {
        title: 'Trip Not Found'
      });
    }

    const ticketClasses = await db.collection('ticketClasses').find({}).toArray();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
      class: ticketClass.class,
      name: ticketClass.name,
      price: trip.distance * ticketClass.pricePerKm,
      amenities: ticketClass.amenities,
      description: ticketClass.description
    }));

    return res.render('trips/book', {
      title: 'Book Trip',
      schedule,
      ticketOptions
    });
  } catch (error) {
    return next(error);
  }
};

const processBookingRequest = async (req, res, next) => {
  try {
    const booking = {
      id: generateConfirmationCode(),
      ...req.body
    };

    const savedBooking = await createBooking(booking);

    return res.redirect(`/trips/confirmation/${savedBooking.id}`);
  } catch (error) {
    return next(error);
  }
};

const getAllBookingsApi = async (req, res, next) => {
  try {
    const parsed = parsePaginationParams(req.query);

    if (parsed.error) {
      return res.status(400).json({
        error: parsed.error
      });
    }

    const { page, limit } = parsed;

    const { bookings, totalBookings } = await getPaginatedBookings({
      page,
      limit,
      email: req.user.email,
      isAdmin: req.user.role === 'admin'
    });

    const totalPages = Math.ceil(totalBookings / limit) || 1;

    return res.status(200).json({
      bookings,
      pagination: {
        page,
        limit,
        totalItems: totalBookings,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages
      }
    });
  } catch (error) {
    return next(error);
  }
};

const updateBookingApi = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    if (!canAccessBooking(booking, req.user)) {
      return res.status(403).json({
        message: 'Forbidden'
      });
    }

    const allowedTicketClasses = ['first', 'standard', 'premium'];

    const updateData = {
      ticketClass: req.body.ticketClass
    };

    if (!allowedTicketClasses.includes(updateData.ticketClass)) {
      return res.status(400).json({
        message: 'Invalid ticket class. Use first, standard, or premium.'
      });
    }

    const updatedBooking = await updateBooking(id, updateData);

    return res.status(200).json({
      booking: updatedBooking
    });
  } catch (error) {
    return next(error);
  }
};

const deleteBookingApi = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    if (!canAccessBooking(booking, req.user)) {
      return res.status(403).json({
        message: 'Forbidden'
      });
    }

    await deleteBooking(id);

    return res.status(200).json({
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
};

const bookingConfirmationPage = async (req, res, next) => {
  try {
    const { confirmationId } = req.params;

    const booking = await getBookingById(confirmationId);

    if (!booking) {
      return res.status(404).render('errors/404', {
        title: 'Booking Not Found'
      });
    }

    return res.render('trips/confirm', {
      title: 'Trip Confirmation',
      confirmation: booking
    });
  } catch (error) {
    return next(error);
  }
};

const bookingsAdminPage = (req, res) => {
  return res.render('bookings', {
    title: 'Bookings Admin'
  });
};

export {
  bookingPage,
  processBookingRequest,
  getAllBookingsApi,
  updateBookingApi,
  deleteBookingApi,
  bookingConfirmationPage,
  bookingsAdminPage
};