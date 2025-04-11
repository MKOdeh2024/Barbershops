// src/components/ui/DatePicker.tsx
import React from 'react';

interface DatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  id: string;
  // Add other props needed by the underlying library (e.g., minDate, maxDate)
}

/**
 * Placeholder DatePicker component.
 * RECOMMENDATION: Replace this with a robust library like react-day-picker or react-datepicker
 * for production use to handle calendar UI, localization, accessibility, etc.
 *
 * Example using react-day-picker:
 * 1. npm install react-day-picker date-fns
 * 2. Import { DayPicker } from 'react-day-picker';
 * 3. Import 'react-day-picker/dist/style.css';
 * 4. Render <DayPicker mode="single" selected={selectedDate} onSelect={onChange} ... />
 */
const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onChange,
  label,
  id,
  ...props // Pass extra props to the underlying element/library
}) => {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = event.target.value;
    if (dateStr) {
      // Basic parsing, consider timezone implications. date-fns is better.
      onChange(new Date(dateStr + 'T00:00:00'));
    } else {
      onChange(null);
    }
  };

  // Format Date object back to YYYY-MM-DD for input value
  const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : '';

  return (
    <div className="w-full">
        {label && (
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            </label>
        )}
        {/* Basic HTML5 date input as a visual placeholder */}
        <input
            type="date"
            id={id}
            name={id}
            value={formattedDate}
            onChange={handleDateChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            {...props}
        />
        <p className="text-xs text-gray-500 mt-1">
            (Note: Using basic date input. Replace with a proper calendar library for better UX.)
        </p>
    </div>
  );
};

export default DatePicker;