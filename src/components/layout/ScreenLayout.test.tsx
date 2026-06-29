import { render, screen } from '@testing-library/react';
import { ScreenLayout } from './ScreenLayout';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('ScreenLayout component', () => {
  it('renders children correctly', () => {
    render(<ScreenLayout>Content Here</ScreenLayout>);
    expect(screen.getByText('Content Here')).toBeInTheDocument();
  });

  it('applies centered styles when centered prop is true', () => {
    render(<ScreenLayout centered>Centered Content</ScreenLayout>);

    // ScreenLayout wraps children in a div that gets centered styles.
    // Uses `safe center` so the content stays reachable from the top when
    // it is taller than the viewport.
    const element = screen.getByText('Centered Content');
    expect(element).toHaveStyle({ alignItems: 'safe center', justifyContent: 'safe center' });
  });
});
