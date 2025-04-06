// backend/routes/paymentRoutes.js
import express from 'express';
import {
    processPayment,
    handlePaymentWebhook,
    getPaymentByBookingId
} from '../controllers/paymentController.js';
import { protect } from '../routes/authMiddleware.js';

const router = express.Router();

// Raw body parser needed for webhook verification
// You might need to configure this globally in server.js or use a middleware here
// Example: app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes);
router.post('/webhook', handlePaymentWebhook); // Public, secured by signature verification

router.post('/process/:bookingId', protect, processPayment); // User initiates payment
router.get('/booking/:bookingId', protect, getPaymentByBookingId); // Get payment status for a booking

export default router;