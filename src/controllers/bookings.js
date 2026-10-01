import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import {
  createBooking,
  getAllBookings,
  getBookingsByPassengerEmail,
  getBookingById,
  updateBooking,
  deleteBooking
} from '../models/bookings.js';

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
    const bookings = req.user.role === 'admin'
      ? await getAllBookings()
      : await getBookingsByPassengerEmail(req.user.email);

    return res.status(200).json({ bookings });
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

    const updatedBooking = await updateBooking(id, req.body);

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