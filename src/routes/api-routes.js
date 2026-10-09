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
 *     summary: Get a paginated list of bookings
 *     description: Admin users receive all bookings. Authenticated non-admin users receive only bookings where their email matches a passenger. Results are sorted by booking date, newest first.
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number to retrieve (must be a positive integer)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of bookings per page (maximum 50)
 *     responses:
 *       200:
 *         description: A page of bookings with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Booking record
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       400:
 *         description: Invalid page or limit parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: page must be a positive integer
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

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get a paginated, filterable list of trips
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number to retrieve (must be a positive integer)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trips per page (max 50)
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by exact region match
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: Filter by exact bestSeason match
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Keyword search, matches trip name or description (case-insensitive)
 *     responses:
 *       200:
 *         description: A page of trips with pagination metadata
 *       400:
 *         description: Invalid page or limit parameter
 *       500:
 *         description: Server error
 * /api/trips/{id}:
 *   get:
 *     summary: Get a single trip by id
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested trip
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.get('/trips', getAllTrips);
router.get('/trips/:id', getTripById);

router.get('/ticket-classes', getAllTicketClasses);

export default router;