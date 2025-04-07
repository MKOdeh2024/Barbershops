// backend/validators/authValidator.js
import { body, validationResult } from 'express-validator';

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return 400 Bad Request with the first error message for simplicity
    // Production apps might return all errors
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// Validation rules for user registration
export const registerValidationRules = () => {
  return [
    // first_name must be non-empty string
    body('first_name')
        .trim()
        .notEmpty().withMessage('First name is required.')
        .isString().withMessage('First name must be a string.'),

    // last_name must be non-empty string
    body('last_name')
        .trim()
        .notEmpty().withMessage('Last name is required.')
        .isString().withMessage('Last name must be a string.'),

    // email must be a valid email
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),

    // password must be at least 8 chars long
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
        // Optional: Add complexity requirements (e.g., .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/) )
        .withMessage('Password does not meet complexity requirements.'), // Adjust message if adding complexity

    // phone_number (optional) must be a valid phone number format if provided
    body('phone_number')
        .optional({ checkFalsy: true }) // Allows empty string or null/undefined
        .trim()
        .isMobilePhone('any', { strictMode: false }).withMessage('Please provide a valid phone number.'),
         // Consider specific locales e.g. .isMobilePhone('he-IL') for Israel/Palestine

     // role (optional, usually set by backend logic, but validating if sent)
     body('role')
        .optional()
        .isIn(['Client', 'Co-Barber', 'Admin']).withMessage('Invalid role specified.'),

  ];
};

// Validation rules for user login
export const loginValidationRules = () => {
    return [
        body('email')
            .trim()
            .isEmail().withMessage('Please provide a valid email address.')
            .normalizeEmail(),

        body('password')
            .notEmpty().withMessage('Password is required.'),
    ];
};


// Export the handler along with rule generators
export { handleValidationErrors };

// You would create similar files (e.g., bookingValidator.js) for other routes.