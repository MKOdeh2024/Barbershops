// src/components/ui/Card.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '../src/components/ui/Card'; // Adjust path if needed

describe('Card Component', () => {
  test('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    const contentElement = screen.getByText(/card content/i);
    expect(contentElement).toBeInTheDocument();
  });

  test('applies default padding class (p-6)', () => {
    render(<Card>Default Padding</Card>);
    // Get the element by its children's text and check its class
    // Note: Checking specific Tailwind classes can be brittle. Testing behavior is often better.
    // Here we check if the default padding class 'p-6' is applied.
    const cardElement = screen.getByText(/default padding/i).parentElement; // Get the div itself
    expect(cardElement).toHaveClass('p-6');
    expect(cardElement).not.toHaveClass('p-4'); // Ensure other paddings aren't applied
    expect(cardElement).not.toHaveClass('p-8');
  });

  test('applies small padding class (p-4) when padding="sm"', () => {
    render(<Card padding="sm">Small Padding</Card>);
    const cardElement = screen.getByText(/small padding/i).parentElement;
    expect(cardElement).toHaveClass('p-4');
    expect(cardElement).not.toHaveClass('p-6');
  });

   test('applies large padding class (p-8) when padding="lg"', () => {
    render(<Card padding="lg">Large Padding</Card>);
    const cardElement = screen.getByText(/large padding/i).parentElement;
    expect(cardElement).toHaveClass('p-8');
    expect(cardElement).not.toHaveClass('p-6');
  });

   test('applies no padding class when padding="none"', () => {
    render(<Card padding="none">No Padding</Card>);
    const cardElement = screen.getByText(/no padding/i).parentElement;
    expect(cardElement).not.toHaveClass('p-4');
    expect(cardElement).not.toHaveClass('p-6');
     expect(cardElement).not.toHaveClass('p-8');
  });


  test('applies base card styles', () => {
    render(<Card>Base Styles</Card>);
    const cardElement = screen.getByText(/base styles/i).parentElement;
    // Check for essential base classes
    expect(cardElement).toHaveClass('bg-white');
    expect(cardElement).toHaveClass('rounded-lg'); // Or rounded-xl if you changed it
    expect(cardElement).toHaveClass('shadow'); // Or shadow-md
  });

  test('applies additional className prop', () => {
    render(<Card className="custom-class another-class">With Custom Class</Card>);
    const cardElement = screen.getByText(/with custom class/i).parentElement;
    expect(cardElement).toHaveClass('custom-class');
    expect(cardElement).toHaveClass('another-class');
    expect(cardElement).toHaveClass('bg-white'); // Ensure base classes still exist
  });
});