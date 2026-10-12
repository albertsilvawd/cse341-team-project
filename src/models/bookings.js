import Booking from './schemas/bookings.js';

const createBooking = async (bookingData) => {
  const booking = new Booking(bookingData);
  return booking.save();
};

const getAllBookings = async () => {
  return Booking.find({}).lean();
};


const getPaginatedBookings = async ({
  page,
  limit,
  email,
  isAdmin,
  ticketClass,
  startDate,
  endDate
}) => {
  const skip = (page - 1) * limit;

  const filter = isAdmin
    ? {}
    : { 'passengers.email': email };

  if (ticketClass) {
    filter.ticketClass = ticketClass;
  }

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = startDate;
    }

    if (endDate) {
      filter.createdAt.$lt = endDate;
    }
  }

  const [bookings, totalBookings] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter)
  ]);

  return { bookings, totalBookings };
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
  getPaginatedBookings,
  getBookingsByPassengerEmail,
  updateBooking,
  deleteBooking,
  getBookingById
};