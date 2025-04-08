import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import Button from '../../components/Button';
import { createBooking, CreateBookingData } from '../../services/bookingService'; // Import API function
import { useRouter } from 'next/router'; // To redirect on success


const BookingSummary = () => {
  const { state, dispatch } = useBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialize router

  const handleConfirmBooking = async () => {
      // Ensure all required data is present
      if (!state.selectedServiceId || !state.selectedBarberId || !state.selectedDate || !state.selectedTimeSlot) {
          setError("Booking details incomplete. Please go back and ensure all steps are completed.");
          return;
      }

      setLoading(true);
      setError(null);

      try {
          // Combine date and time into an ISO string for the backend
          const bookingDateTime = new Date(state.selectedDate);
          const [hours, minutes] = state.selectedTimeSlot.split(':');
          bookingDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

          const bookingData: CreateBookingData = {
              service_id: state.selectedServiceId,
              barber_id: state.selectedBarberId,
              booking_time_str: bookingDateTime.toISOString(),
              // Add product details here if implemented
          };

          const confirmation = await createBooking(bookingData);
          console.log('Booking Confirmed:', confirmation);

          // Booking successful - reset state and redirect or show success message
          dispatch({ type: 'RESET_BOOKING' });
          // Redirect to a confirmation page or dashboard
          router.push(`/booking-confirmation/${confirmation.booking_id}`); // Example redirect

      } catch (err: any) {
          console.error('Failed to confirm booking:', err);
          setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Step 4: Confirm Booking</h2>
       <button
            type="button"
            className="text-sm text-indigo-600 hover:underline mb-4"
            onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
        >
            &larr; Back to Date/Time
        </button>

      {/* Summary Display */}
      <div className="space-y-3 bg-gray-100 p-4 rounded mb-6 border border-gray-200">
          <h3 className="text-lg font-medium border-b pb-2 mb-3">Booking Summary</h3>
          <p><strong>Service:</strong> {state.selectedServiceName || 'Not selected'}</p>
          <p><strong>Barber:</strong> {state.selectedBarberName || 'Not selected'}</p>
          <p><strong>Date:</strong> {state.selectedDate?.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || 'Not selected'}</p>
          <p><strong>Time:</strong> {state.selectedTimeSlot ? new Date(`1970-01-01T${state.selectedTimeSlot}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not selected'}</p>
          {/* TODO: Display calculated price */}
          {/* <p className="font-semibold mt-2">Estimated Price: $XX.XX</p> */}
      </div>

      {/* Error Display */}
      {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                  <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
              </div>
          </div>
       )}

       {/* Action Buttons */}
       <div className="flex justify-between items-center">
            <Button variant="secondary" onClick={() => dispatch({ type: 'PREVIOUS_STEP' })} disabled={loading}>
                Back
            </Button>
           <Button
                variant="primary"
                onClick={handleConfirmBooking}
                disabled={!state.selectedTimeSlot || loading} // Ensure time is selected and not already submitting
           >
               {loading ? 'Confirming...' : 'Confirm & Book Appointment'}
           </Button>
       </div>
    </div>
  );
};

export default BookingSummary;