// backend/controllers/bookingController.js
import { AppDataSource } from '../config/db.js';
import { LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm'; // Import necessary operators
import Booking from '../config/models/Booking.js';
import User from '../config/models/User.js';
import Barber from '../config/models/Barber.js';
import Service from '../config/models/Service.js';
import Availability from '../config/models/Availability.js';
import { In } from 'typeorm';
// Import BookingProduct if handling product additions during booking
// import BookingProduct from '../models/BookingProduct.js';
// Import notification service if needed
// import { sendBookingConfirmationNotification } from '../services/notificationService.js'; // Example

const bookingRepository = AppDataSource.getRepository(Booking);
const serviceRepository = AppDataSource.getRepository(Service);
const availabilityRepository = AppDataSource.getRepository(Availability);
const barberRepository = AppDataSource.getRepository(Barber); // Needed if checking barber status

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Client or Admin)
export const createBooking = async (req, res) => {
  // 1. Get Input Data
  const { barber_id, service_id, booking_time_str /*, product_ids, quantities */ } = req.body;
  const user_id = req.user?.userId; // Assuming user ID comes from auth middleware

  // --- 2. Input Validation (Basic Checks - Use dedicated validator middleware for thorough validation) ---
  if (!user_id) {
      return res.status(401).json({ message: 'User not authenticated' });
  }
  if (!barber_id || !service_id || !booking_time_str) {
    return res.status(400).json({ message: 'Missing required fields: barber_id, service_id, booking_time_str' });
  }

  let booking_time;
  try {
      booking_time = new Date(booking_time_str);
      if (isNaN(booking_time.getTime())) {
          throw new Error('Invalid date format');
      }
      // Optional: Check if booking time is in the past
      if (booking_time < new Date()) {
          return res.status(400).json({ message: 'Booking time cannot be in the past' });
      }
  } catch (e) {
       return res.status(400).json({ message: 'Invalid booking_time format. Please use a valid ISO string.' });
  }

  try {
    // --- 3. Fetch Related Data ---
    const service = await serviceRepository.findOneBy({ service_id });
    if (!service) {
      return res.status(404).json({ message: `Service with ID ${service_id} not found` });
    }
    if (!service.estimated_duration || service.estimated_duration <= 0) {
        return res.status(400).json({ message: `Service ${service.name} has an invalid duration.`});
    }

    const barber = await barberRepository.findOne({ where: {barber_id, status: 'Active'} });
    if (!barber) {
        return res.status(404).json({ message: `Barber with ID ${barber_id} not found or is inactive.` });
    }


    // --- 4. Check Availability ---
    const bookingDate = booking_time.toISOString().split('T')[0]; // Get YYYY-MM-DD
    const estimated_duration_ms = service.estimated_duration * 60 * 1000; // Duration in milliseconds
    const booking_end_time = new Date(booking_time.getTime() + estimated_duration_ms);

    // Format times for comparison (HH:MM:SS) - important for TypeORM time type query
    const startTimeStr = booking_time.toTimeString().split(' ')[0];
    const endTimeStr = booking_end_time.toTimeString().split(' ')[0];

    // Find barber's available slots for that specific date
    const availabilitySlots = await availabilityRepository.find({
        where: {
            barber_id: barber_id,
            date: bookingDate,
            is_available: true,
            // Check if the barber's available block *contains* the requested slot
            available_from: LessThanOrEqual(startTimeStr), // Slot start <= Booking start
            available_until: MoreThanOrEqual(endTimeStr)    // Slot end >= Booking end
        }
    });

    if (availabilitySlots.length === 0) {
        return res.status(409).json({ message: 'Barber is not available for the entire duration of the requested time slot on this date.' });
    }

    // Check for conflicting bookings for the *same barber*
    const conflictingBooking = await bookingRepository.findOne({
        where: {
            barber_id: barber_id,
            status: Between('Pending', 'Confirmed'), // Check pending and confirmed bookings
            // Check for overlap:
            // (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
            booking_time: LessThanOrEqual(booking_end_time), // Existing start <= New end
            // We need to calculate the end time of existing bookings to compare properly
            // This requires fetching potential conflicts and checking overlap in code, or a more complex SQL query.
            // Simplified check (might miss some edge cases depending on exact timing logic): Check if any existing booking *starts* within the new booking's time range.
            // A more robust check needs ExistingEndTime > booking_time
        },
         // Add relations if needed for calculation or logging
    });

     // --- Refined Conflict Check (Requires fetching potential conflicts first) ---
     const potentialConflicts = await bookingRepository.find({
        relations: ['service'], // Need service to get duration of existing bookings
        where: {
            barber_id: barber_id,
            status: In(['Pending', 'Confirmed']), // TypeORM v0.3+ might use In([...])
            // Narrow down the search window around the booking time for efficiency
            booking_time: Between(
                new Date(booking_time.getTime() - 2 * 60 * 60 * 1000), // e.g., check 2 hours before
                new Date(booking_end_time.getTime() + 2 * 60 * 60 * 1000) // e.g., check 2 hours after
            ),
        }
     });

     for (const existingBooking of potentialConflicts) {
        if (!existingBooking.service?.estimated_duration) continue; // Skip if duration missing
        const existingStartTime = existingBooking.booking_time;
        const existingEndTime = new Date(existingStartTime.getTime() + existingBooking.service.estimated_duration * 60 * 1000);

        // Check for overlap: (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
        if (existingStartTime < booking_end_time && existingEndTime > booking_time) {
             return res.status(409).json({ message: `Time slot conflicts with an existing booking (${existingBooking.booking_id})` });
        }
     }
     // --- End Refined Conflict Check ---


    // --- 5. Calculate Price (Basic - Add Product Logic Later) ---
    let total_price = parseFloat(service.price.toString());
    // TODO: If product_ids and quantities are provided:
    // Fetch products, check stock, calculate product total, add to service price.


    // --- 6. Create Booking (Use Transaction) ---
    const newBooking = await AppDataSource.transaction(async transactionalEntityManager => {
        const booking = new Booking();
        booking.user_id = user_id;
        booking.barber_id = barber_id;
        booking.service_id = service_id;
        booking.booking_time = booking_time; // Store as timestamp
        booking.estimated_duration = service.estimated_duration;
        booking.total_price = total_price;
        booking.status = 'Confirmed'; // Default to 'Confirmed' or 'Pending' based on settings/flow
        booking.payment_status = 'Pending';

        const savedBooking = await transactionalEntityManager.save(booking);

        // TODO: If product_ids provided, create BookingProduct entries here
        // using transactionalEntityManager.save(BookingProduct, {...})

        return savedBooking; // Return the saved booking from the transaction
    });


    // --- 7. Post-Booking Actions (Outside Transaction) ---
    // TODO: Trigger notification to user and possibly barber
    // Example: sendBookingConfirmationNotification(newBooking);
    // TODO: Call external payment service if payment is required immediately
    // Example: initiatePaymentProcess(newBooking.booking_id, total_price);


    // --- 8. Send Response ---
    res.status(201).json(newBooking); // Return the created booking details

  } catch (error) {
    console.error("Error creating booking:", error);
    // Specific error handling (e.g., transaction rollback is handled by TypeORM)
    res.status(500).json({ message: 'Server Error creating booking' });
  }
};

// --- Other bookingController functions (getBookings, getBookingById, etc.) remain here ---
// They would need similar refinement for logic, error handling, and authorization checks.

// Example placeholder for getBookings (already partially implemented previously)
export const getBookings = async (req, res) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const { barberId, date, status } = req.query; // Optional filters

  try {
    // TODO: Add validation for query params (e.g., date format, valid status)

    const queryOptions: {
      relations: string[];
      order: { [key: string]: string };
      where: { [key: string]: any };
    } = {
      relations: ['user', 'barber', 'service', 'payment'],
      order: { booking_time: 'ASC' },
      where: { user_id: null, barber_id: null }
    };

    // --- Authorization & Filtering Logic ---
    if (userRole === 'Client') {
        queryOptions.where.user_id = userId;
    } else if (userRole === 'Co-Barber') {
        // Co-Barber sees their own bookings unless admin overrides via query
        const barberProfile = await barberRepository.findOneBy({ user_id: userId });
        if (!barberProfile) {
            return res.status(403).json({ message: 'Barber profile not found for this user.' });
        }
        // Allow filtering by specific barberId ONLY if it matches the logged-in barber OR if user is Admin (handled below)
        if (barberId && parseInt(barberId, 10) !== barberProfile.barber_id) {
             return res.status(403).json({ message: 'Co-Barbers can only view their own bookings or filter by their own ID.' });
        }
        queryOptions.where.barber_id = barberId ? parseInt(barberId, 10) : barberProfile.barber_id;

    } else if (userRole === 'Admin') {
        // Admin can view all or filter by barberId
        if (barberId) {
            queryOptions.where.barber_id = parseInt(barberId, 10);
        }
    } else {
         return res.status(403).json({ message: 'Forbidden: Role not recognized' });
    }

    // --- Additional Filtering ---
    if (status) {
        queryOptions.where.status = status; // Add status filter if provided
    }
    if (date) {
        // Filter by specific date - requires careful handling of timestamp comparison
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0); // Start of the day
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999); // End of the day
        queryOptions.where.booking_time = Between(startDate, endDate);
    }
    // Could add filters for date ranges, payment status etc.

    // Fetch bookings based on constructed query
    const bookings = await bookingRepository.find(queryOptions);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: 'Server Error fetching bookings' });
  }
};

// Add implementations for getBookingById, updateBookingStatus, deleteBooking following similar patterns
// ...
export const getBookingById = async (req, res) => {
    // I command you to implement logic to fetch a specific booking
    // by its ID, considering the user's role and permissions.
    // You may need to add additional filtering or checks.
    let bookingId = req.params.bookingId;

    try {
        const booking = await bookingRepository.findOneBy({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
            }
            // Check if the user has permission to view this booking
            if (req.user.role === 'Client' && booking.user_id !== req.user.userId) {
                return res.status(403).json({ message: 'You do not have permission to view this booking' });
            }
            if (req.user.role === 'Co-Barber' && booking.barber_id !== req.user.userId) {
                return res.status(403).json({ message: 'You do not have permission to view this booking' });
            }
            if (req.user.role === 'Admin') {
                // Admin can view all bookings
            } else {
                return res.status(403).json({ message: 'You do not have permission to view this booking' });
            }
            res.json(booking);
        } catch (error) {
            console.error("Error fetching booking:", error);
            res.status(500).json({ message: 'Server Error fetching booking' });
        }

}

export const updateBookingStatus = async (req, res) => {
    // Implement logic to update the status of a booking
    let bookingId = req.params.bookingId;
    let status = req.body.status;
    try {
        const booking = await bookingRepository.findOneBy({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
            }
            // Check if the user has permission to update this booking
            if (req.user.role === 'Client' && booking.user_id !== req.user.userId) {
                return res.status(403).json({ message: 'You do not have permission to update this booking' });
            }
            if (req.user.role === 'Co-Barber' && booking.barber_id !== req.user.userId) {
                return res.status(403).json({ message: 'You do not have permission to update this booking' });
            }
            if (req.user.role === 'Admin') {
                // Admin can update any booking
            } else {
                return res.status(403).json({ message: 'You do not have permission to update this booking' });
            }
            booking.status = status;
            const updatedBooking = await bookingRepository.save(booking);
            res.json(updatedBooking);
        } catch (error) {
            console.error("Error updating booking status:", error);
            res.status(500).json({ message: 'Server Error updating booking status' });
        }
}

export const deleteBooking = async (req, res) => {
    // Implement logic to delete a booking
    let bookingId = req.params.bookingId;
    try {
        const booking = await bookingRepository.findOneBy({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
            }
            // Check if the user has permission to delete this booking
            if (req.user.role === 'Client' && booking.user_id !== req.user.userId) {
                return res.status(403).json({ message: 'You do not have permission to delete this booking' });
            }
            if (req.user.role === 'Co-Barber' && booking.barber_id !== req.user.userId) {
                return res.status(403).json({ message: 'You do not have permission to delete this booking' });
            }
            if (req.user.role === 'Admin') {
                // Admin can delete any booking
            } else {
                return res.status(403).json({ message: 'You do not have permission to delete this booking' });
            }
            await bookingRepository.remove(booking);
            res.json({ message: 'Booking deleted successfully' });
            } catch (error) {   
                console.error("Error deleting booking:", error);
                res.status(500).json({ message: 'Server Error deleting booking' });
                }
}