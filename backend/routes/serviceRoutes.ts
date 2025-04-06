// backend/routes/serviceRoutes.js
import express from 'express';
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} from '../controllers/serviceController.js';
import { protect, admin } from '../routes/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createService) // Only Admin creates
    .get(getAllServices);                // Public access

router.route('/:id')
    .get(getServiceById)                 // Public access
    .put(protect, admin, updateService)     // Only Admin updates
    .delete(protect, admin, deleteService); // Only Admin deletes

export default router;