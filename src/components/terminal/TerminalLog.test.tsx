import { render, screen } from '@testing-library/react';
import { TerminalLog } from './TerminalLog';
import { describe, it, expect, vi } from 'vitest';
import type { LogEntry } from '../../lib/types';
import React from 'react';

const mockEntries: LogEntry[] = [
  { timestamp: '12:00:00', type: 'info', message: 'System starting' },
  { timestamp: '12:00:01', type: 'success', message: 'Database connected' },
  { timestamp: '12:00:02', type: 'warning', message: 'High CPU usage' },
  { timestamp: '12:00:03', type: 'error', message: 'Failed to fetch config' },
];

describe('TerminalLog component', () => {
  it('renders "Waiting for activity..." when entries is empty', () => {
    render(<TerminalLog entries={[]} />);
    expect(screen.getByText('Waiting for activity...')).toBeInTheDocument();
  });

  it('renders log entries correctly with prefixes and timestamps', () => {
    render(<TerminalLog entries={mockEntries} />);

    expect(screen.getByText('[12:00:00]')).toBeInTheDocument();
    expect(screen.getByText('System starting')).toBeInTheDocument();

    expect(screen.getByText('[12:00:01]')).toBeInTheDocument();
    expect(screen.getByText('Database connected')).toBeInTheDocument();

    expect(screen.getByText('[12:00:02]')).toBeInTheDocument();
    expect(screen.getByText('High CPU usage')).toBeInTheDocument();

    expect(screen.getByText('[12:00:03]')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch config')).toBeInTheDocument();

    // The header/footer elements are also rendered
    expect(screen.getByText(/Activity Log/)).toBeInTheDocument();
  });
});
