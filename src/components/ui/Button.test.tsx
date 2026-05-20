import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { describe, it, expect } from 'vitest';

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByText('⏳')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
