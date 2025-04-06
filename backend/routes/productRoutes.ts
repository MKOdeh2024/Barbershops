// backend/routes/productRoutes.js
import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { protect, admin } from '../routes/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createProduct) // Only Admin creates
    .get(getAllProducts);                // Public access

router.route('/:id')
    .get(getProductById)                 // Public access
    .put(protect, admin, updateProduct)     // Only Admin updates
    .delete(protect, admin, deleteProduct); // Only Admin deletes

export default router;