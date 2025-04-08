// Example: src/components/booking/ServiceSelector.tsx (Simplified)
import React from 'react';
import { useBooking } from '../../context/BookingContext';
import Button from '../../components/Button';

const ServiceSelector = () => {
  const { dispatch } = useBooking();
  // TODO: Fetch services from API

  const handleSelectService = (serviceId: number, serviceName: string, serviceDuration: number) => {
    dispatch({
        type: 'SELECT_SERVICE',
        payload: { id: serviceId, name: serviceName, duration: serviceDuration }
    });
    // No need to manually call next step if reducer handles it
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1: Select Service</h2>
      {/* Render service options here */}
      <div className="space-y-2">
          {/* Example Service */}
          <div className="border p-3 rounded flex justify-between items-center">
              <span>Classic Haircut (30 min)</span>
              <Button size="sm" onClick={() => handleSelectService(1, 'Classic Haircut', 30)}>Select</Button>
          </div>
           {/* Add more services */}
      </div>
    </div>
  );
};

export default ServiceSelector;