import { render, screen } from '@testing-library/react';
import { Input } from './Input';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Input component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('passes ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies error styles when hasError is true', () => {
    render(<Input hasError data-testid="error-input" />);
    const input = screen.getByTestId('error-input');
    // Directly checking style.border because JSDOM's toHaveStyle fails to parse shorthand properties containing CSS variables
    expect(input.style.border).toContain('var(--status-error)');
  });
});
