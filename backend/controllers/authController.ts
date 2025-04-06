// backend/controllers/authController.js
import { AppDataSource } from '../config/db.js';
import User from '../config/models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userRepository = AppDataSource.getRepository(User);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { first_name, last_name, email, password, phone_number, role } = req.body; // Role might be restricted

  try {
    // TODO: Add validation (e.g., using express-validator or joi)

    const userExists = await userRepository.findOneBy({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User();
    user.first_name = first_name;
    user.last_name = last_name;
    user.email = email;
    user.phone_number = phone_number;
    user.role = role || 'Client'; // Default to Client if not provided or restricted
    await user.hashPassword(password); // Hash password using method in User model

    const savedUser = await userRepository.save(user);

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const token = jwt.sign(
      {
        userId: savedUser.user_id,
        role: savedUser.role,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
      },
      jwtSecret
    );

    res.status(201).json({
      user_id: savedUser.user_id,
      first_name: savedUser.first_name,
      email: savedUser.email,
      role: savedUser.role,
      token: token, // Send token upon successful registration
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // TODO: Add validation

    const user = await userRepository.findOneBy({ email });

    if (user && (await user.comparePassword(password))) {
      // Generate JWT
      const token = jwt.sign(
        { userId: user.user_id, role: user.role },
        process.env.JWT_SECRET ?? 'default-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN, 10) : 86400 } // 86400 is equivalent to 1 day
      );

      res.json({
        user_id: user.user_id,
        first_name: user.first_name,
        email: user.email,
        role: user.role,
        token: token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile (example protected route)
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    // User ID should be attached to req by auth middleware
    const userId = req.user?.userId; // Assuming middleware adds 'user' object to req

    if (!userId) {
        return res.status(401).json({ message: 'Not authorized, no user ID found' });
    }

    try {
        const user = await userRepository.findOne({ where: { user_id: userId }, select: ['user_id', 'first_name', 'last_name', 'email', 'role', 'phone_number', 'profile_picture'] }); // Select specific fields

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};