// tests/Card.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '../src/components/ui/Card'; // Adjust the import path as necessary

describe('Card Component', () => {
  it('applies default padding class (p-6)', () => {
    render(<Card>Default Padding</Card>);
    const cardElement = screen.getByText(/default padding/i); // <- do NOT use `.parentElement`
    expect(cardElement).toHaveClass('p-6');
  });

  it('applies small padding class (p-4) when padding="sm"', () => {
    render(<Card padding="sm">Small Padding</Card>);
    const cardElement = screen.getByText(/small padding/i);
    expect(cardElement).toHaveClass('p-4');
  });

  it('applies large padding class (p-8) when padding="lg"', () => {
    render(<Card padding="lg">Large Padding</Card>);
    const cardElement = screen.getByText(/large padding/i);
    expect(cardElement).toHaveClass('p-8');
  });

  it('applies base card styles', () => {
    render(<Card>Base Styles</Card>);
    const cardElement = screen.getByText(/base styles/i);
    expect(cardElement).toHaveClass('bg-white', 'rounded-lg', 'shadow');
  });

  it('applies additional className prop', () => {
    render(<Card className="custom-class another-class">With Custom Class</Card>);
    const cardElement = screen.getByText(/with custom class/i);
    expect(cardElement).toHaveClass('custom-class');
    expect(cardElement).toHaveClass('another-class');
  });
});
