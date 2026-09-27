import { Router } from 'express';
import {
    getAllStationsApi,
    getStationByIdApi
} from '../controllers/stations.js';
import { getTripById, getAllTrips } from '../controllers/trips.js';
import { getMyBookings } from '../controllers/bookings.js';
import { requireApiLogin } from '../middleware/auth.js';

const router = Router();

// Stations
router.get('/stations', getAllStationsApi);
router.get('/stations/:id', getStationByIdApi);

// Trips
router.get('/trips', getAllTrips);
router.get('/trips/:id', getTripById);

// Bookings
router.get('/bookings/my-bookings', requireApiLogin, getMyBookings);

export default router;