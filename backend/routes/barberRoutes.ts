// backend/routes/barberRoutes.js
import express from 'express';
import {
    createBarber,
    getAllBarbers,
    getBarberById,
    updateBarber,
    deleteBarber,
    setBarberAvailability,
    getBarberAvailability
} from '../controllers/barberController.js';
import { protect, admin, barberOrAdmin } from '../routes/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createBarber) // Only Admin creates
    .get(getAllBarbers);                // Public access to get all barbers

router.route('/:id')
    .get(getBarberById)                 // Public access to get specific barber
    .put(protect, admin, updateBarber)     // Only Admin updates
    .delete(protect, admin, deleteBarber); // Only Admin deletes

// Availability routes
router.route('/:id/availability')
    .get(getBarberAvailability)             // Public can get availability
    .post(protect, barberOrAdmin, setBarberAvailability); // Barber/Admin can set availability

export default router;