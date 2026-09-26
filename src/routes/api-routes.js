import { Router } from 'express';
import {
    getAllStationsApi,
    getStationByIdApi
} from '../controllers/stations.js';
import { getTripById, getAllTrips } from '../controllers/trips.js';
import { getAllTicketClasses } from '../controllers/ticket-classes.js';

const router = Router();

// Stations
router.get('/stations', getAllStationsApi);
router.get('/stations/:id', getStationByIdApi);

// Trips
router.get('/trips', getAllTrips);
router.get('/trips/:id', getTripById);

router.get('/ticket-classes', getAllTicketClasses);

export default router;