import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

describe('ProgressBar component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with current and total', () => {
    render(<ProgressBar current={5} total={10} />);
    expect(screen.getByText(/5\/10 \(50%\)/)).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<ProgressBar current={5} total={10} label="Processing" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('hides count when showCount is false', () => {
    render(<ProgressBar current={5} total={10} showCount={false} />);
    expect(screen.queryByText(/5\/10 \(50%\)/)).not.toBeInTheDocument();
  });

  it('shows ETA when startTime is provided', () => {
    const startTime = Date.now();
    render(<ProgressBar current={5} total={10} startTime={startTime} />);
    expect(screen.getByText(/ETA:/)).toBeInTheDocument();
  });
});
