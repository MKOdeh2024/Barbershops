// backend/middleware/errorMiddleware.js
import { QueryFailedError } from 'typeorm'; // Example TypeORM error

const errorHandler = (err, req, res, next) => {
  // Log the error internally (consider using a dedicated logger like Winston in production)
  console.error('ERROR LOG:', new Date().toISOString());
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  // Avoid logging sensitive request body parts in production logs
  // console.error('Request Body:', req.body);
  console.error('Error Stack:', err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if status code not already set
  let message = 'Internal Server Error';

  // Handle specific error types for more granular responses

  // TypeORM QueryFailedError (e.g., duplicate entry, constraint violation)
  if (err instanceof QueryFailedError) {
      statusCode = 400; // Often bad request due to invalid data
      message = 'Database query failed.';
      // Provide more specific messages in development/debug mode if needed
      if (process.env.NODE_ENV !== 'production' && err.driverError) {
          // Be careful exposing driver errors directly
           message = `Database Error: ${err.driverError.detail || err.message}`;
      } else if (err.driverError && err.driverError.code === '23505') {
          message = 'Duplicate entry. A record with this value already exists.';
      }
      // Add checks for other relevant err.code values
  }

  // Handle custom errors (if you define specific error classes)
  // if (err instanceof CustomValidationError) {
  //   statusCode = 400;
  //   message = err.message;
  // }
  // if (err instanceof NotFoundError) {
  //   statusCode = 404;
  //   message = err.message;
  // }
   // if (err instanceof AuthenticationError) {
   //   statusCode = 401;
   //   message = err.message;
   // }
   // if (err instanceof AuthorizationError) {
   //   statusCode = 403;
   //   message = err.message;
   // }

   // Check if the error object itself has status/statusCode and message properties
   if (err.statusCode) {
       statusCode = err.statusCode;
       message = err.message || message;
   } else if (err.status) {
       statusCode = err.status;
       message = err.message || message;
   }


   // Default fallback message in production to avoid leaking details
   if (process.env.NODE_ENV === 'production' && statusCode === 500) {
       message = 'An unexpected error occurred on the server.';
   }


  res.status(statusCode).json({
    message: message,
    // Optionally include stack trace in development mode ONLY
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

// Middleware for handling 404 Not Found errors
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass error to the general error handler
};


export { errorHandler, notFound };