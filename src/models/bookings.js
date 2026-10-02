import Booking from './schemas/bookings.js';

const createBooking = async (bookingData) => {
  const booking = new Booking(bookingData);
  return booking.save();
};

const getAllBookings = async () => {
  return Booking.find({}).lean();
};

const getBookingById = async (id) => {
  return Booking.findOne({ id }).lean();
};

export { createBooking, getAllBookings, getBookingById };