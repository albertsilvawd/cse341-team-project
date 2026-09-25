import {
  bookingPage,
  processBookingRequest,
  bookingConfirmationPage
} from '../controllers/bookings.js';

import { Router } from 'express';

const router = Router();

router.get('/booking/:scheduleId', bookingPage);

router.post('/book', processBookingRequest);

// Booking confirmation page
router.get('/confirmation/:confirmationId', bookingConfirmationPage);

export default router;