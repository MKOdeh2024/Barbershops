import { AppDataSource } from '../config/db.js';
import { LessThanOrEqual, MoreThanOrEqual, Between, In, IsNull, FindOptionsOrder} from 'typeorm';
import Booking from '../config/models/Booking.js';
import User from '../config/models/User.js';
import Barber from '../config/models/Barber.js';
import Service from '../config/models/Service.js';
import Availability from '../config/models/Availability.js';
// import BookingProduct from '../models/BookingProduct.js';
// import { sendBookingConfirmationNotification } from '../services/notificationService.js';

const bookingRepository = AppDataSource.getRepository(Booking);
const serviceRepository = AppDataSource.getRepository(Service);
const availabilityRepository = AppDataSource.getRepository(Availability);
const barberRepository = AppDataSource.getRepository(Barber);

export const createBooking = async (req, res) => {
  const { barber_id, service_id, booking_time_str } = req.body;
  const user_id = req.user?.userId;

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
    if (booking_time < new Date()) {
      return res.status(400).json({ message: 'Booking time cannot be in the past' });
    }
  } catch (e) {
    return res.status(400).json({ message: 'Invalid booking_time format. Please use a valid ISO string.' });
  }

  try {
    const service = await serviceRepository.findOneBy({ service_id });
    if (!service) {
      return res.status(404).json({ message: `Service with ID ${service_id} not found` });
    }
    if (!service.estimated_duration || service.estimated_duration <= 0) {
      return res.status(400).json({ message: `Service ${service.name} has an invalid duration.` });
    }

    const barber = await barberRepository.findOne({ where: { barber_id, status: 'Active' } });
    if (!barber) {
      return res.status(404).json({ message: `Barber with ID ${barber_id} not found or is inactive.` });
    }

    const bookingDate = booking_time.toISOString().split('T')[0];
    const estimated_duration_ms = service.estimated_duration * 60 * 1000;
    const booking_end_time = new Date(booking_time.getTime() + estimated_duration_ms);

    const startTimeStr = booking_time.toTimeString().split(' ')[0];
    const endTimeStr = booking_end_time.toTimeString().split(' ')[0];

    const availabilitySlots = await availabilityRepository.find({
      where: {
        barber_id: barber_id,
        date: bookingDate,
        is_available: true,
        available_from: LessThanOrEqual(startTimeStr),
        available_until: MoreThanOrEqual(endTimeStr)
      }
    });

    if (availabilitySlots.length === 0) {
      return res.status(409).json({ message: 'Barber is not available for the entire duration of the requested time slot on this date.' });
    }

    const potentialConflicts = await bookingRepository.find({
      relations: ['service'],
      where: {
        barber_id: barber_id,
        status: In(['Pending', 'Confirmed']),
        booking_time: Between(
          new Date(booking_time.getTime() - 2 * 60 * 60 * 1000),
          new Date(booking_end_time.getTime() + 2 * 60 * 60 * 1000)
        ),
      }
    });

    for (const existingBooking of potentialConflicts) {
      if (!existingBooking.service?.estimated_duration) continue;
      const existingStartTime = existingBooking.booking_time;
      const existingEndTime = new Date(existingStartTime.getTime() + existingBooking.service.estimated_duration * 60 * 1000);

      if (existingStartTime < booking_end_time && existingEndTime > booking_time) {
        return res.status(409).json({ message: `Time slot conflicts with an existing booking (${existingBooking.booking_id})` });
      }
    }

    let total_price = parseFloat(service.price.toString());

    const newBooking = await AppDataSource.transaction(async transactionalEntityManager => {
      const booking = new Booking();
      booking.user_id = user_id;
      booking.barber_id = barber_id;
      booking.service_id = service_id;
      booking.booking_time = booking_time;
      booking.estimated_duration = service.estimated_duration;
      booking.total_price = total_price;
      booking.status = 'Confirmed';
      booking.payment_status = 'Pending';

      const savedBooking = await transactionalEntityManager.save(booking);

      return savedBooking;
    });

    // TODO: Trigger notifications and payment processing here

    res.status(201).json(newBooking);

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: 'Server Error creating booking' });
  }
};

export const getBookings = async (req, res) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const { barberId, date, status } = req.query;

  try {
    const queryOptions = {
      relations: ['user', 'barber', 'service', 'payment'],
      order: { booking_time: 'ASC' as 'ASC' },
      where: { 
        user_id: userId,
        barber_id: barberId ? barberId.toString() : null,
        status: status,
        booking_time: null as any // Update the type here
      }
    };


    if (userRole === 'Client') {
      queryOptions.where.user_id = userId;
    } else if (userRole === 'Co-Barber') {
      const barberProfile = await barberRepository.findOneBy({ user_id: userId });
      if (!barberProfile) {
        return res.status(403).json({ message: 'Barber profile not found for this user.' });
      }
      if (barberId && parseInt(barberId, 10) !== barberProfile.barber_id) {
        return res.status(403).json({ message: 'Co-Barbers can only view their own bookings or filter by their own ID.' });
      }
      queryOptions.where.barber_id = barberId ? parseInt(barberId, 10) : barberProfile.barber_id;
    } else if (userRole === 'Admin') {
      if (barberId) {
        queryOptions.where.barber_id = parseInt(barberId, 10);
      }
    } else {
      return res.status(403).json({ message: 'Forbidden: Role not recognized' });
    }

    if (status) {
      queryOptions.where.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
     queryOptions.where.booking_time = date ? Between(startDate, endDate) : IsNull();
    }

    const bookings = await bookingRepository.find(queryOptions);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: 'Server Error fetching bookings' });
  }
};

export const getBookingById = async (req, res) => {
  const bookingId = req.params.bookingId;

  try {
    const booking = await bookingRepository.findOneBy({ booking_id: bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
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
};

export const updateBookingStatus = async (req, res) => {
  const bookingId = req.params.bookingId;
  const status = req.body.status;

  try {
    const booking = await bookingRepository.findOneBy({ booking_id: bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
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
};

export const deleteBooking = async (req, res) => {
  const bookingId = req.params.bookingId;

  try {
    const booking = await bookingRepository.findOneBy({ booking_id: bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
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
};
