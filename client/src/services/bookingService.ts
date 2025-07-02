import api from '../utils/api';
import { BookingState } from '../context/bookingContextTypes'; // Import state shape

// Define the data structure needed to create a booking
export interface CreateBookingData {
    service_id: number | string;
    barber_id: number | string;
    booking_time_str: string; // ISO string format expected by backend
    // Add product IDs if implementing product booking
    // product_ids?: (number | string)[];
}

// Define the structure of the created Booking object returned by the API
export interface BookingConfirmation {
  booking_id: number | string;
  user_id: number | string;
  barber_id: number | string;
  service_id: number | string;
  status: string;
  booking_time: string; // ISO String from backend
  estimated_duration: number;
  total_price: string | number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  // Include related objects if returned (user, barber, service)
}


/**
 * Creates a new booking.
 * @param bookingDetails - Data derived from the BookingContext state.
 */
export const createBooking = async (bookingDetails: CreateBookingData): Promise<BookingConfirmation> => {
    try {
        const response = await api.post<BookingConfirmation>('/bookings', bookingDetails);
        return response.data;
    } catch (error) {
        console.error('Create Booking API call failed:', error);
        throw error;
    }
};

export const getBookingsForBarberAndDate = async (barberId: number | string, dateStr: string): Promise<any[]> => {
    try {
        const response = await api.get<any[]>(`/bookings/barber/${barberId}/date/${dateStr}`);
        return response.data;
    } catch (error) {
        console.error('Get Bookings for Barber and Date API call failed:', error);
        throw error;
    }
};


// Add functions for fetching user's bookings (getMyUpcomingBookings, getBookingHistory)
// Add function for cancelling a booking (cancelBooking(bookingId))
// Add function for getting booking details (getBookingById(bookingId))