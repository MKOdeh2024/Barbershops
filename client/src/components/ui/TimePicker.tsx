// src/components/ui/TimePicker.tsx
import React from 'react';

interface TimePickerProps {
  selectedValue: string | null; // e.g., "09:00", "14:30"
  onChange: (value: string | null) => void;
  label?: string;
  id: string;
  timeSlots?: string[]; // Optional array of available time slots
  // Add other props as needed by potential library
}

/**
 * Placeholder TimePicker component.
 * RECOMMENDATION: Replace this with a custom dropdown, list of buttons, or a dedicated library
 * for better user experience and control, especially when dealing with specific available slots.
 */
const TimePicker: React.FC<TimePickerProps> = ({
  selectedValue,
  onChange,
  label,
  id,
  timeSlots = [], // Default to empty array
  ...props
}) => {
  const handleTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value || null);
  };

  return (
    <div className="w-full">
       {label && (
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            </label>
        )}
      {/* Using a simple select dropdown as a placeholder */}
      <select
        id={id}
        name={id}
        value={selectedValue ?? ''}
        onChange={handleTimeChange}
        className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
        {...props}
      >
        <option value="" disabled>
          Select a time...
        </option>
        {timeSlots.length > 0 ? (
            timeSlots.map(slot => (
                <option key={slot} value={slot}>
                     {/* Format time for display */}
                     {new Date(`1970-01-01T${slot}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </option>
            ))
        ) : (
            <option value="" disabled>No available slots</option>
        )}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        (Note: Using basic select. Replace with a proper time selection UI.)
      </p>
    </div>
  );
};

export default TimePicker;