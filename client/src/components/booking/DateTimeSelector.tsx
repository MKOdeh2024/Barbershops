import React, { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { getBarberAvailability, AvailabilitySlot } from '../../services/barberService';
import Button from '../../components/Button';
// Note: A real implementation would use a proper Calendar library (e.g., react-day-picker, react-calendar)
// This is a highly simplified placeholder.

// Helper function to format date to YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Helper function to generate time slots (example)
const generateTimeSlots = (start: string, end: string, durationMinutes: number, existingBookings: any[] = []): string[] => {
    const slots: string[] = [];
    let currentTime = new Date(`1970-01-01T${start}Z`); // Use UTC to avoid timezone issues with time only
    const endTime = new Date(`1970-01-01T${end}Z`);
    const bookingDurationMs = durationMinutes * 60 * 1000;

    while (currentTime.getTime() + bookingDurationMs <= endTime.getTime()) {
        const slotStartTimeStr = currentTime.toISOString().substring(11, 16); // HH:MM format

        // TODO: Add more robust check against existingBookings for this specific day
        const isSlotAvailable = true; // Placeholder - needs real check

        if (isSlotAvailable) {
            slots.push(slotStartTimeStr);
        }
        // Increment time by service duration or a fixed interval (e.g., 15/30 mins)
        currentTime = new Date(currentTime.getTime() + bookingDurationMs); // Increment by service duration
        // Or increment by fixed interval: currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    return slots;
}


const DateTimeSelector = () => {
  const { state, dispatch } = useBooking();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(state.selectedDate ? formatDateToYYYYMMDD(state.selectedDate) : '');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability when barber and date are selected
  useEffect(() => {
    if (state.selectedBarberId && selectedDateStr) {
      setLoading(true);
      setError(null);
      setAvailableTimeSlots([]); // Clear old slots
      const fetchAvailability = async () => {
        try {
          const data = await getBarberAvailability(state.selectedBarberId!, selectedDateStr);
          setAvailability(data); // Store the raw available blocks

          // --- Generate concrete time slots based on availability blocks and service duration ---
          if (data.length > 0 && state.selectedServiceDuration) {
              let generatedSlots: string[] = [];
              // TODO: Fetch existing bookings for this barber/date to exclude booked slots
              // const existingBookings = await getBookingsForBarberAndDate(state.selectedBarberId, selectedDateStr);
              const existingBookings: any[] = []; // Placeholder

              data.forEach(slotBlock => {
                 generatedSlots = [
                     ...generatedSlots,
                     ...generateTimeSlots(slotBlock.available_from, slotBlock.available_until, state.selectedServiceDuration!, existingBookings)
                 ];
              });
              // Remove duplicates and sort
              setAvailableTimeSlots([...new Set(generatedSlots)].sort());
          } else {
              setAvailableTimeSlots([]);
          }
          // -------------------------------------------------------------------------------------

        } catch (err) {
          setError(`Failed to load availability for ${selectedDateStr}.`);
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchAvailability();
    } else {
        setAvailability([]); // Clear if barber/date not selected
        setAvailableTimeSlots([]);
    }
  }, [state.selectedBarberId, selectedDateStr, state.selectedServiceDuration]); // Re-fetch when these change

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newDateStr = event.target.value;
      setSelectedDateStr(newDateStr);
      if (newDateStr) {
          const dateObj = new Date(newDateStr + 'T00:00:00'); // Ensure correct date object parsing
          dispatch({ type: 'SELECT_DATE', payload: dateObj });
      } else {
           dispatch({ type: 'SELECT_DATE', payload: null });
      }
  };

  const handleSelectTimeSlot = (slot: string) => {
    dispatch({ type: 'SELECT_TIME_SLOT', payload: slot });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Step 3: Select Date & Time</h2>
        <button
            type="button"
            className="text-sm text-indigo-600 hover:underline mb-4"
            onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
        >
            &larr; Back to Barbers
        </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Selection (Placeholder - Use a Calendar component) */}
        <div>
          <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            id="booking-date"
            value={selectedDateStr}
            onChange={handleDateChange}
            min={formatDateToYYYYMMDD(new Date())} // Prevent selecting past dates
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={!state.selectedBarberId} // Disable if no barber selected
          />
           {!state.selectedBarberId && <p className="text-xs text-gray-500 mt-1">Please select a barber first.</p>}
        </div>

        {/* Time Slot Selection */}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Times {selectedDateStr ? `on ${new Date(selectedDateStr + 'T00:00:00').toLocaleDateString()}` : ''}
          </label>
          {loading && <p className="text-gray-500">Loading available times...</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!loading && !error && selectedDateStr && state.selectedBarberId && (
            <div className="max-h-48 overflow-y-auto border rounded p-2 grid grid-cols-3 gap-2">
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={state.selectedTimeSlot === slot ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleSelectTimeSlot(slot)}
                    className="text-xs md:text-sm" // Adjust text size for smaller buttons
                  >
                    {/* Format time for display (e.g., 9:00 AM) */}
                    {new Date(`1970-01-01T${slot}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Button>
                ))
              ) : (
                <p className="text-gray-500 col-span-full text-center text-sm py-4">No available slots found for this date.</p>
              )}
            </div>
          )}
           {!selectedDateStr && state.selectedBarberId && <p className="text-xs text-gray-500 mt-1">Please select a date to see available times.</p>}
        </div>
      </div>

       <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}>
                Back
            </Button>
           <Button disabled={!state.selectedTimeSlot} onClick={() => dispatch({ type: 'NEXT_STEP' })}>
               Next: Review Booking
           </Button>
       </div>
    </div>
  );
};

export default DateTimeSelector;