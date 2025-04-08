import React, { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { getBarbers, Barber } from '../../services/barberService'; // Import API function and type
import Button from '../../components/Button';

const BarberSelector = () => {
  const { state, dispatch } = useBooking();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBarbers();
        // TODO: Add logic here to filter barbers based on the selected service if needed
        // This depends on how your backend/business logic works (e.g., barbers specialize)
        setBarbers(data);
      } catch (err) {
        setError('Failed to load barbers. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBarbers();
  }, []); // Fetch only on mount (or refetch if selected service changes and filtering is needed)

  const handleSelectBarber = (barber: Barber) => {
    dispatch({
      type: 'SELECT_BARBER',
      payload: { id: barber.barber_id, name: barber.user.first_name }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Step 2: Select Barber</h2>
       <button
            type="button"
            className="text-sm text-indigo-600 hover:underline mb-4"
            onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
        >
            &larr; Back to Services
        </button>

      {loading && <p className="text-gray-500">Loading barbers...</p>}
      {error && <p className="text-red-600 p-3 bg-red-100 rounded">{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {barbers.length > 0 ? (
            barbers.map((barber) => (
              <div
                key={barber.barber_id}
                onClick={() => handleSelectBarber(barber)}
                className={`border rounded-lg p-4 text-center cursor-pointer transition-all duration-150 ${state.selectedBarberId === barber.barber_id ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50 hover:shadow-md'}`}
              >
                 {/* Basic profile picture placeholder */}
                <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto mb-2 flex items-center justify-center text-gray-500">
                  {barber.user.profile_picture ? (
                     <img src={barber.user.profile_picture} alt={barber.user.first_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                     <span>{barber.user.first_name.charAt(0)}</span>
                  )}
                </div>
                <p className="font-medium">{barber.user.first_name}</p>
                <p className="text-xs text-gray-500">{barber.specialization || 'General Barber'}</p>
              </div>
            ))
          ) : (
             <p className="text-gray-500 col-span-full">No barbers available at the moment.</p>
          )}
        </div>
      )}
        {/* Navigation Buttons (Optional Here or in Parent) */}
       {/* <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}>
                Back
            </Button>
           <Button disabled={!state.selectedBarberId} onClick={() => dispatch({ type: 'NEXT_STEP' })}>
               Next: Select Date & Time
           </Button>
       </div> */}
    </div>
  );
};

export default BarberSelector;