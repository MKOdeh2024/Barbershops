import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppDataSource } from '../config/db.js';
import User from '../config/models/User.js';


const userRepository = AppDataSource.getRepository(User);

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'default-secret-key') as JwtPayload;

            // Get user from the token (select only necessary fields, exclude password)
            // You might want to cache user details briefly instead of hitting DB on every request
            req.user = await userRepository.findOne({ where: { user_id: decoded.userId }, select: ['user_id', 'role'] });

            if (!req.user) {
                 throw new Error('User not found'); // Handle case where user might have been deleted after token issuance
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to check for specific roles
export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an Admin' });
    }
};

export const barberOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Co-Barber')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as Barber or Admin' });
    }
};