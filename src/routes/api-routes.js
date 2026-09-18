import { Router } from 'express';
import {
    getAllStationsApi,
    getStationByIdApi
} from '../controllers/stations.js';

const router = Router();

// Get all stations
router.get('/stations', getAllStationsApi);

// Get a station by ID
router.get('/stations/:id', getStationByIdApi);

export default router;
