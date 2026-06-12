import { render, screen } from '@testing-library/react';
import { Terminal } from './Terminal';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Terminal component', () => {
  it('renders children correctly', () => {
    render(<Terminal>Terminal Content</Terminal>);
    expect(screen.getByText('Terminal Content')).toBeInTheDocument();
  });

  it('applies custom style properties', () => {
    render(<Terminal style={{ marginTop: '20px' }}>Content</Terminal>);
    const container = screen.getByText('Content').parentElement;
    expect(container).toHaveStyle({ marginTop: '20px' });
  });
});
