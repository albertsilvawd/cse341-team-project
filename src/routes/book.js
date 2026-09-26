import { getDb } from '../db/connect.js';
import { generateConfirmationCode } from '../includes/helpers.js';
import { getAllTicketClasses } from '../models/ticket-classes.js';

const bookingPage = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const db = getDb();
    const schedule = await db
      .collection('schedules')
      .findOne({ id: Number(scheduleId) });
    const trip = await db.collection('trips').findOne({ id: schedule.tripId });

    // Refactored to use the new Mongoose ticket-class model function:
    const ticketClasses = await getAllTicketClasses();

    const ticketOptions = ticketClasses.map((ticketClass) => ({
      class: ticketClass.class,
      name: ticketClass.name,
      price: trip ? trip.distance * ticketClass.pricePerKm : 0,
      amenities: ticketClass.amenities,
      description: ticketClass.description
    }));

    res.render('trips/book', {
      title: 'Book Trip',
      schedule,
      ticketOptions
    });
  } catch (error) {
    console.error('Error rendering booking page:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      message: 'Failed to load booking page'
    });
  }
};

const processBookingRequest = async (req, res) => {
  const confirmation = {
    id: generateConfirmationCode(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  await getDb().collection('confirmations').insertOne(confirmation);

  res.redirect(`/trips/confirmation/${confirmation.id}`);
};

export { bookingPage, processBookingRequest };