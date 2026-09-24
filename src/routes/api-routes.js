import { Router } from 'express';

import {
    getAllStationsApi,
    getStationByIdApi
} from '../controllers/stations.js';

import { getAllBookingsApi } from '../controllers/bookings.js';

const router = Router();

// Get all stations
router.get('/stations', getAllStationsApi);

// Get a station by ID
router.get('/stations/:id', getStationByIdApi);

// Get all bookings
router.get('/bookings', getAllBookingsApi);

export default router;