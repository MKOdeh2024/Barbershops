// backend/src/types/express/index.d.ts

// Import the original Request type if needed, or rely on global namespace
// import { Request } from 'express';

// Define the structure of the 'user' object added by your auth middleware
// Adjust this based on what your 'protect' middleware actually attaches
interface AuthenticatedUser {
    userId: number | string; // Or just number/string depending on your ID type
    role: 'Admin' | 'Co-Barber' | 'Client';
    // Add any other properties your middleware might attach
}

// Use declaration merging to add the custom property to the Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser; // Make it optional as it won't exist on unauthenticated requests
        }
    }
}

// If using modules, you might need an empty export to treat this as a module
export {};
