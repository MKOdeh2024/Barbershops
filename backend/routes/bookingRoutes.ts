// backend/routes/bookingRoutes.js
import express from 'express';
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking
} from '../controllers/bookingController.js';
import { protect, barberOrAdmin } from '../routes/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createBooking)   // Logged-in users can create
    .get(protect, getBookings);     // Logged-in users can get (filtered in controller)

router.route('/:id')
    .get(protect, getBookingById)    // Protected, needs controller logic for owner/barber/admin
    .delete(protect, deleteBooking); // Protected, needs controller logic for owner/admin

router.route('/:id/status')
    .put(protect, barberOrAdmin, updateBookingStatus); // Only Barber or Admin can update status

export default router;