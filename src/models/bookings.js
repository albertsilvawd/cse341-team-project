import Booking from './schemas/bookings.js';

const createBooking = async (bookingData) => {
  const booking = new Booking(bookingData);
  return booking.save();
};

const getAllBookings = async () => {
  return Booking.find({}).lean();
};

const getBookingsByPassengerEmail = async (email) => {
  return Booking.find({
    'passengers.email': email
  }).lean();
};

const getBookingById = async (id) => {
  return Booking.findOne({ id }).lean();
};

const updateBooking = async (id, bookingData) => {
  return Booking.findOneAndUpdate(
    { id },
    bookingData,
    { returnDocument: 'after', runValidators: true }
  ).lean();
};

const deleteBooking = async (id) => {
  return Booking.findOneAndDelete({ id }).lean();
};

export {
  createBooking,
  getAllBookings,
  getBookingsByPassengerEmail,
  updateBooking,
  deleteBooking,
  getBookingById
};