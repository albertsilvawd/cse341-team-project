import { Router } from 'express';

import {
    getAllStationsApi,
    getStationByIdApi
} from '../controllers/stations.js';
import { getTripById, getAllTrips } from '../controllers/trips.js';

import { getAllBookingsApi } from '../controllers/bookings.js';

const router = Router();

// Stations
router.get('/stations', getAllStationsApi);
router.get('/stations/:id', getStationByIdApi);

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: A list of bookings
 *       500:
 *         description: Server error
 */
router.get('/bookings', getAllBookingsApi);

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get a paginated list of trips
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

export default router;