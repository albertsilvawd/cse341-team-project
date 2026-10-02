import mongoose from 'mongoose';
import ticketClassSchema from './schemas/ticket-classes.js';

const TicketClass =
  mongoose.models.TicketClass ||
  mongoose.model('TicketClass', ticketClassSchema, 'ticket-classes');
/**
 * Returns all ticket classes
 */
export const getAllTicketClasses = async () => {
  return await TicketClass.find().sort({ pricePerKm: 1 });
};

/**
 * Returns ticket classes available for a specific day of the week
 * @param {string} day - e.g., 'Monday', 'Friday'
 */
export const getTicketClassesForDay = async (day) => {
  if (!day) {
    return await getAllTicketClasses();
  }

  // Normalize case (e.g., 'monday' -> 'Monday')
  const formattedDay =
    day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();

  // If a document has availableDays, match on it; if it doesn't have the field yet, treat it as available on all days
  return await TicketClass.find({
    $or: [
      { availableDays: formattedDay },
      { availableDays: { $exists: false } },
      { availableDays: { $size: 0 } }
    ]
  }).sort({ pricePerKm: 1 });
};

export default TicketClass;