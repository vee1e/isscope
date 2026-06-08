import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Header component', () => {
  it('renders logo text and version', () => {
    render(<Header />);
    expect(screen.getByText('Isscope')).toBeInTheDocument();
    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it('renders rightContent when provided', () => {
    render(<Header rightContent={<button>Login</button>} />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
