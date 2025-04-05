// server.js (or app.ts if using TypeScript)
import 'reflect-metadata'; // Must be imported first for TypeORM
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/db.js'; // Assuming db connection logic is here
// Import routes
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
// ... other route imports

dotenv.config({ path: './.env' }); // Load .env variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Body parser for JSON requests
app.use(express.urlencoded({ extended: true }));

// Database Connection
connectDatabase()
  .then(() => {
    console.log('Database connected successfully');

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/bookings', bookingRoutes);
    // ... use other routes

    // Basic Root Route
    app.get('/', (req, res) => {
      res.send('Barbershop API Running');
    });

    // Start Server
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Basic Error Handling (improve as needed)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app; // For testing or potential clustering