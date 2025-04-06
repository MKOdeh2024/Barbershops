// backend/routes/adminRoutes.js
import express from 'express';
import {
    getAllSettings,
    updateSettings
    // Import other admin-specific controller functions as needed
    // e.g., getDashboardStats, manageUsers (if not in userRoutes), etc.
} from '../controllers/adminController.js';
import { protect, admin } from '../routes/authMiddleware.js'; // Import necessary middleware

// Create a new router instance
const router = express.Router();

// --- Admin Settings Routes ---
// All routes in this file are implicitly prefixed with '/api/admin' (defined in server.js)

router.route('/settings')
    // GET /api/admin/settings
    // Retrieves all application settings. Requires user to be authenticated and an admin.
    .get(protect, admin, getAllSettings)

    // PUT /api/admin/settings
    // Updates multiple application settings. Requires user to be authenticated and an admin.
    // Expects a JSON body with key-value pairs of settings to update.
    .put(protect, admin, updateSettings);


// --- Add other Admin-Specific Routes here ---
// Example: Route for getting dashboard statistics
// router.get('/dashboard-stats', protect, admin, getDashboardStats);

// Example: Routes for managing specific aspects if not covered elsewhere
// router.route('/manage/something')
//     .get(protect, admin, /* controller function */)
//     .post(protect, admin, /* controller function */);


// Export the router to be used in server.js
export default router;