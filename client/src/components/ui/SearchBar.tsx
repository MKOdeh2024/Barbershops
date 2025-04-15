// src/components/ui/SearchBar.tsx
import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string; // Class for the wrapping form element
  inputClassName?: string; // Class specifically for the input
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
  className = '',
  inputClassName = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newTerm = event.target.value;
    setSearchTerm(newTerm);
    // If you want search-as-you-type (debounced), add logic here
    // onSearch(newTerm); // Example: Immediate search on change
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(searchTerm.trim());
  };

  const handleClear = () => {
      setSearchTerm('');
      onSearch(''); // Trigger search with empty term
  }

  return (
    // Apply width constraints and inline-block to the form itself
    <form
        onSubmit={handleSubmit}
        // Example: Max width, inline-block display
        className={`relative inline-block w-full max-w-sm md:max-w-md lg:max-w-lg ${className}`}
        // Example: Fixed width instead of max-width
        // className={`relative inline-block w-96 ${className}`} // w-96 is 24rem / 384px
     >
      <label htmlFor="search-bar" className="sr-only">
        Search
      </label>
      <div className="relative">
        {/* Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-5 w-5 text-gray-400" /* ... icon props ... */>
            {/* ... icon path ... */}
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          id="search-bar"
          name="search-bar"
          // Use inputClassName prop for specific input styles if needed
          className={`block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 leading-5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm ${inputClassName}`}
          placeholder={placeholder}
          type="search"
          value={searchTerm}
          onChange={handleInputChange}
        />
        {/* Clear button */}
        {searchTerm && (
             <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 flex items-center pr-3 group" // Added group for potential hover effects
                aria-label="Clear search"
            >
                 <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-600" /* ... icon props ... */ >
                    {/* ... icon path ... */}
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
            </button>
        )}
      </div>
      {/* Hidden submit button for accessibility/enter key */}
      <button type="submit" className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>Search</button>
    </form>
  );
};

export default SearchBar;