//src/routes/ejs-routes.js
import { Router } from 'express';
import {
    registerPage,
    loginPage,
    register,
    login,
    logout,
    adminDashboardPage
} from '../controllers/auth.js';
import { requirePageRole,requirePageLogin } from '../middleware/auth.js';
import { listTripsPage, tripDetailsPage, tripsAdminPage } from '../controllers/trips.js';

const router = Router();

// Auth pages
router.get('/register', registerPage);
router.post('/register', register);
router.get('/login', loginPage);
router.post('/login', login);
router.get('/logout', logout);
router.get('/admin', requirePageRole('admin'), adminDashboardPage);

// Trips list/details pages
router.get('/trips', listTripsPage);
router.get('/trips/:tripId', tripDetailsPage);

router.get('/trips-admin', requirePageLogin, requirePageRole('admin'), tripsAdminPage);

export default router;