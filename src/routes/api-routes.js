import { Router } from 'express';

import {
    getAllStationsApi,
    getStationByIdApi
} from '../controllers/stations.js';
import { getTripById, getAllTrips, updateTripApi, deleteTripApi } from '../controllers/trips.js';
import { getAllTicketClasses } from '../controllers/ticket-classes.js';

import { getAllBookingsApi } from '../controllers/bookings.js';
import { requireApiRole } from '../middleware/auth.js';

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
// Trips
router.get('/trips', getAllTrips);
router.get('/trips/:id', getTripById);
router.put('/trips/:id', requireApiRole('admin'), updateTripApi);
router.delete('/trips/:id', requireApiRole('admin'), deleteTripApi);


router.get('/ticket-classes', getAllTicketClasses);

export default router;