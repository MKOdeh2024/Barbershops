// config/db.js (or db.ts)
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
//import mysql2 from 'mysql2'
// Import your entities
import User from '../config/models/User.js';
import Barber from '../config/models/Barber.js';
import Booking from '../config/models/Booking.js';
import Service from '../config/models/Service.js';
import Payment from '../config/models/Payment.js';
import Notification from '../config/models/Notification.js';
import Product from '../config/models/Product.js';
import BookingProduct from '../config/models/BookingProduct.js';
import Availability from '../config/models/Availability.js';
import AdminSetting from '../config/models/AdminSetting.js';

dotenv.config({ path: '../.env' }); // Adjust path as necessary
const databaseType = process.env.DB_TYPE as 'mysql' | 'postgres'; // Add other allowed types as needed

export const AppDataSource = new DataSource({
    type: 'mysql', // Default to postgres
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barbershops',
    synchronize: true, // Auto-create schema in dev, disable in prod
    //logging: process.env.NODE_ENV === 'development', // Log SQL queries in dev
    entities: [
        User, Barber, Booking, Service, Payment,
        Notification, Product, BookingProduct, Availability, AdminSetting
    ], //
    migrations: ["./migrations/*.{js,ts}"], // Define migrations for production
    subscribers: [],
});

export const connectDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
    } catch (error) {
        console.error("Error during Data Source initialization:", error);
        throw error; // Re-throw error to be caught by server startup logic
    }
};