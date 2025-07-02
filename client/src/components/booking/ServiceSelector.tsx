import React, { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import Button from '../../components/Button';
import { getServices } from '../../services/serviceService';
import { Service } from '../../types/serviceTypes'; // Import Service type

const ServiceSelector = () => {
  const { dispatch } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: Service[] = await getServices();
        setServices(data);
      } catch (err) {
        setError('Failed to load services. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleSelectService = (serviceId: number | string, serviceName: string, serviceDuration: number) => {
    dispatch({
        type: 'SELECT_SERVICE',
        payload: { id: serviceId, name: serviceName, duration: serviceDuration }
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1: Select Service</h2>
      {loading && <p>Loading services...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="space-y-2">
        {services.length > 0 ? (
          services.map(service => (
            <div key={service.service_id} className="border p-3 rounded flex justify-between items-center">
              <span>{service.name} ({service.estimated_duration} min)</span>
              <Button size="sm" onClick={() => handleSelectService(service.service_id, service.name, service.estimated_duration)}>Select</Button>
            </div>
          ))
        ) : (
          !loading && <p>No services available.</p>
        )}
      </div>
    </div>
  );
};

export default ServiceSelector;
