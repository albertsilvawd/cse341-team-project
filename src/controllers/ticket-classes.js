import {
  getAllTicketClasses as fetchAllTicketClasses,
  getTicketClassesForDay as fetchTicketClassesForDay
} from '../models/ticket-classes.js';

/**
 * Handles GET /api/ticket-classes and /api/ticket-classes?day={day}
 */
export const getAllTicketClasses = async (req, res) => {
  try {
    const { day } = req.query;

    if (day) {
      const filtered = await fetchTicketClassesForDay(day);
      return res.status(200).json(filtered);
    }

    const ticketClasses = await fetchAllTicketClasses();
    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error('Error in getAllTicketClasses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Handles day lookup if called directly
 */
export const getTicketClassesForDay = async (req, res) => {
  try {
    const day = req.query.day || req.params.day;
    const ticketClasses = await fetchTicketClassesForDay(day);
    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error('Error in getTicketClassesForDay:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};