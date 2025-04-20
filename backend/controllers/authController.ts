// backend/controllers/authController.js
import  express from 'express';
import { AppDataSource } from '../config/db.js';
import User from '../config/models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; // Built-in Node module for token generation
import nodemailer from 'nodemailer'; // Example email sender library
import { sendConfirmationEmail } from '../utils/emailSender.js'; // Example path

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
      if (!userExists.is_verified) {
        // TODO: Optionally resend confirmation email if user tries to register again
        // return res.status(400).json({ message: 'Account exists but is not verified. Check your email.' });

     }
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User();
    user.first_name = first_name;
    user.last_name = last_name;
    user.email = email;
    user.phone_number = phone_number;
    user.role = role || 'Client'; // Default to Client if not provided or restricted
    user.is_verified = false; // Set to false initially
    await user.hashPassword(password); // Hash password using method in User model

    // Generate confirmation token
    const confirmToken = crypto.randomBytes(32).toString('hex');
    user.confirmation_token = confirmToken;
    // Set token expiry (e.g., 1 hour from now)
    user.confirmation_token_expires = new Date(Date.now() + 3600 * 1000); // 1 hour

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

    // --- Send Confirmation Email ---
    // Construct confirmation URL (adjust URLs from .env)
    const confirmUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/confirm/${confirmToken}`;

    try {
        // Replace with your actual email sending logic
        await sendConfirmationEmail(user.email, user.first_name, confirmUrl);
        console.log(`Confirmation email supposedly sent to ${user.email} with link: ${confirmUrl}`); // Log for debugging

        // Respond to user indicating email has been sent
        return res.status(201).json({
            message: 'Registration successful! Please check your email to confirm your account.',
            // DO NOT send user details or token here
        });

    } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Consider how to handle this - maybe delete the user or mark for retry?
        // For now, return a generic server error but log the specific issue.
        res.status(500).json({ message: 'Registration succeeded but failed to send confirmation email. Please contact support.' });
    }

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

// write a function to confirm registration by link email, if the user clicked the linik, it will confirm the registration and forward it to login page
// make the function send a confirmation email to the user with a link to confirm the registration
// @desc    Confirm registration by link email
// @route   POST /api/v1/auth/confirm-registration-by-link-email
// --- confirmRegistration (New Function) ---
export const confirmRegistration = async (req, res) => {
  const { token } = req.params;

  if (!token) {
      return res.status(400).send('Confirmation token missing.'); // Or redirect to an error page
  }

  try {
      // Find user by token, ensuring token fields were selected
      const user = await userRepository.createQueryBuilder("user")
          .addSelect(["user.confirmation_token", "user.confirmation_token_expires"]) // Explicitly select needed fields
          .where("user.confirmation_token = :token", { token })
          .getOne();

      if (!user) {
          return res.status(400).send('Invalid confirmation token.'); // Or redirect
      }

      // Check if token has expired
      if (!user.confirmation_token_expires || user.confirmation_token_expires < new Date()) {
          // TODO: Optionally allow resending confirmation email here
          return res.status(400).send('Confirmation token has expired.'); // Or redirect
      }

      // Token is valid, verify the user
      user.is_verified = true;
      user.confirmation_token = null; // Clear the token
      user.confirmation_token_expires = null; // Clear expiry

      await userRepository.save(user);

      // Redirect user to the frontend login page with a success indicator
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?confirmed=true`;
      res.redirect(loginUrl);

  } catch (error) {
      console.error('Confirmation error:', error);
      res.status(500).send('An error occurred during account confirmation.'); // Or redirect to generic error page
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

    if (user && user.is_verified && (await user.comparePassword(password))) {
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