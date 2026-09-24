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
import { requirePageRole } from '../middleware/auth.js';

const router = Router();

router.get('/register', registerPage);
router.post('/register', register);
router.get('/login', loginPage);
router.post('/login', login);
router.get('/logout', logout);
router.get('/admin', requirePageRole('admin'), adminDashboardPage);

export default router;