// src/context/BookingContext.tsx
import React, { createContext, useReducer, ReactNode, useContext } from 'react';
import { BookingState, BookingAction, BookingContextProps } from './bookingContextTypes'; // Import types

// Define the initial state for the booking process
const initialBookingState: BookingState = {
  step: 1,
  selectedServiceId: null,
  selectedServiceName: undefined,
  selectedServiceDuration: undefined,
  selectedBarberId: null,
  selectedBarberName: undefined,
  selectedDate: null,
  selectedTimeSlot: null,
};

// Create the reducer function to handle state updates based on actions
const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  console.log('Booking Reducer Action:', action.type, 'Payload:', 'payload' in action ? action.payload : 'N/A'); // For debugging
  switch (action.type) {
    case 'SELECT_SERVICE':
      return {
        ...state,
        selectedServiceId: action.payload.id,
        selectedServiceName: action.payload.name,
        selectedServiceDuration: action.payload.duration,
        // Reset subsequent selections when service changes
        selectedBarberId: null,
        selectedBarberName: undefined,
        selectedDate: null,
        selectedTimeSlot: null,
        step: 2, // Move to next step (or adjust logic)
      };
    case 'SELECT_BARBER':
      return {
        ...state,
        selectedBarberId: action.payload.id,
        selectedBarberName: action.payload.name,
        // Reset subsequent selections
        selectedDate: null,
        selectedTimeSlot: null,
        step: 3, // Move to next step (or adjust logic)
      };
    case 'SELECT_DATE':
      return {
        ...state,
        selectedDate: action.payload,
        selectedTimeSlot: null, // Reset time slot when date changes
        // Step might change depending on flow (e.g., stay on step 3 to select time)
      };
    case 'SELECT_TIME_SLOT':
      return {
        ...state,
        selectedTimeSlot: action.payload,
        step: 4, // Move to confirmation step (or adjust logic)
      };
    case 'SET_STEP':
        // Basic validation to prevent invalid steps might be useful
        if (action.payload < 1) return state;
        return { ...state, step: action.payload };
    case 'NEXT_STEP':
      // Add logic to ensure previous steps are complete before advancing
      return { ...state, step: state.step + 1 };
    case 'PREVIOUS_STEP':
      if (state.step <= 1) return state; // Cannot go below step 1
      return { ...state, step: state.step - 1 };
    case 'RESET_BOOKING':
      return initialBookingState;
    default:
      // If an action type isn't recognized, return the current state
      // This requires casting action to 'any' or using a more robust type check
      console.warn(`Unhandled action type: ${(action as any).type}`);
      return state;
  }
};

// Create the Booking Context
// Initialize with undefined and check for it in useBooking hook
const BookingContext = createContext<BookingContextProps | undefined>(undefined);

// Create the Provider component
interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);

  const contextValue: BookingContextProps = {
    state,
    dispatch,
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// Create a custom hook for easy context consumption
export const useBooking = (): BookingContextProps => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};