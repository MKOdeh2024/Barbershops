// src/context/bookingContextTypes.ts

// Define the shape of the booking state
export interface BookingState {
    step: number; // Current step in the booking process (e.g., 1: Select Service, 2: Select Barber, etc.)
    selectedServiceId: number | string | null;
    selectedServiceName?: string; // Optional: Store name for display
    selectedServiceDuration?: number; // Store duration for calculations
    selectedBarberId: number | string | null;
    selectedBarberName?: string; // Optional: Store name for display
    selectedDate: Date | null; // Use Date object for easier manipulation
    selectedTimeSlot: string | null; // e.g., "09:00", "14:30"
    // Add other relevant state: e.g., availableTimeSlots, calculatedPrice etc.
  }
  
  // Define the possible actions to modify the booking state
  export type BookingAction =
    | { type: 'SELECT_SERVICE'; payload: { id: number | string; name?: string; duration?: number } }
    | { type: 'SELECT_BARBER'; payload: { id: number | string; name?: string } }
    | { type: 'SELECT_DATE'; payload: Date | null }
    | { type: 'SELECT_TIME_SLOT'; payload: string | null }
    | { type: 'SET_STEP'; payload: number }
    | { type: 'NEXT_STEP' }
    | { type: 'PREVIOUS_STEP' }
    | { type: 'RESET_BOOKING' };
  
  // Define the shape of the context value
  export interface BookingContextProps {
    state: BookingState;
    dispatch: React.Dispatch<BookingAction>;
    // Optional: Add helper functions derived from state if needed
    // e.g., isBookingDetailsComplete: () => boolean;
  }