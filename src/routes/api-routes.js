import { Router } from 'express';

import {
    getAllStationsApi,
    getStationByIdApi
} from '../controllers/stations.js';
import { getTripById, getAllTrips } from '../controllers/trips.js';
import {
    getAllBookingsApi,
    updateBookingApi,
    deleteBookingApi
} from '../controllers/bookings.js';
import { requireApiLogin } from '../middleware/auth.js';
import { getAllTicketClasses } from '../controllers/ticket-classes.js';

const router = Router();

// Stations
router.get('/stations', getAllStationsApi);
router.get('/stations/:id', getStationByIdApi);

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: Get bookings for the authenticated user
 *     description: Admin users receive all bookings. Authenticated non-admin users receive only bookings where their email matches a passenger.
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: A list of bookings available to the authenticated user
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/bookings', requireApiLogin, getAllBookingsApi);

/**
 * @openapi
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     description: Admin users can update any booking. Authenticated non-admin users can update a booking only if their email matches one of the passengers.
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking reference ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketClass:
 *                 type: string
 *                 enum:
 *                   - first
 *                   - standard
 *                   - premium
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       400:
 *         description: Invalid ticket class
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to update this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.put('/bookings/:id', requireApiLogin, updateBookingApi);

/**
 * @openapi
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     description: Admin users can delete any booking. Authenticated non-admin users can delete a booking only if their email matches one of the passengers.
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking reference ID
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to delete this booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.delete('/bookings/:id', requireApiLogin, deleteBookingApi);
// Trips
router.get('/trips', getAllTrips);
router.get('/trips/:id', getTripById);

router.get('/ticket-classes', getAllTicketClasses);

export default router;