// backend/server.js (Updated Example)
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js'; // Import error handlers

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import barberRoutes from './routes/barberRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config({ path: './.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Enable CORS - configure origins properly for production

// IMPORTANT: Use express.raw() for webhook BEFORE express.json() if needed globally,
// or apply it specifically to the webhook route before mounting paymentRoutes.
// If applying globally:
// app.use((req, res, next) => {
//   if (req.originalUrl === '/api/payments/webhook') {
//     next(); // Skip json parsing for webhook
//   } else {
//     express.json()(req, res, next); // Use json parser for all other routes
//   }
// });
// app.use('/api/payments/webhook', express.raw({ type: 'application/json' })); // Apply raw parser specifically

app.use(express.json()); // Body parser for JSON requests (must come after raw parser if used globally)
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded requests

// --- Database Connection ---
const startServer = async () => {
  try {
    // Wait for database connection before starting the server
    await connectDatabase();
    console.log('Database connected successfully');

    // --- API Routes ---
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/barbers', barberRoutes);
    app.use('/api/services', serviceRoutes);
    app.use('/api/payments', paymentRoutes); // Ensure raw body parser is handled if needed
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/admin', adminRoutes);

    // Basic Root Route (for testing)
    app.get('/', (req, res) => {
      console.log("Server is running on root route");
      //res.send('Barbershop API Running');
    });

    // --- Basic Error Handling ---
    app.use(notFound); // Handle 404 errors
    app.use(errorHandler); // Handle other errors

    // --- Start Server ---
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });

  } catch (error) {
    console.log('Database connection failed:', error);
    process.exit(1); // Exit the process if the database connection fails
  }
};

// Start the server
startServer();

export default app;