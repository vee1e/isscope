import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import React from 'react';

// Mock the components to avoid rendering complexities in tests
vi.mock('../components/terminal/TerminalLog', () => ({
  TerminalLog: () => <div data-testid="terminal-log" />,
}));

vi.mock('../components/ui/ProgressBar', () => ({
  ProgressBar: ({ current, total, label }: any) => (
    <div data-testid="progress-bar">
      {label}: {current}/{total}
    </div>
  ),
}));

describe('LoadingScreen', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    useAppStore.getState().setRepoInput('test/repo');
    useAppStore.getState().setFetchProgress({ phase: 'fetching', current: 0, total: 10 });
  });

  it('renders fetching phase correctly', () => {
    render(<LoadingScreen />);

    expect(screen.getByText('Fetching Issues')).toBeInTheDocument();
    expect(screen.getByText('test/repo')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('Progress: 0/10');
    expect(screen.getByTestId('terminal-log')).toBeInTheDocument();
  });

  it('renders analyzing phase correctly', () => {
    useAppStore.getState().setFetchProgress({ phase: 'analyzing', current: 5, total: 10 });
    render(<LoadingScreen />);

    expect(screen.getAllByText('Analyzing with AI')[0]).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('Progress: 5/10');
  });

  it('renders history info if provided', () => {
    const historyInfo = { fromHistory: true, issueCount: 42, fetchedAt: new Date() };
    render(<LoadingScreen historyInfo={historyInfo} />);

    expect(screen.getByText(/From History \(42 issues\)/)).toBeInTheDocument();
  });

  it('calls onForceRefresh when refresh button is clicked', () => {
    const onForceRefresh = vi.fn();
    const historyInfo = { fromHistory: true, issueCount: 42, fetchedAt: new Date() };

    render(<LoadingScreen historyInfo={historyInfo} onForceRefresh={onForceRefresh} />);

    const refreshBtn = screen.getByRole('button', { name: /Refresh Data/i });
    fireEvent.click(refreshBtn);

    expect(onForceRefresh).toHaveBeenCalled();
  });

  it('handles cancel action', () => {
    render(<LoadingScreen />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(useAppStore.getState().isCancelled).toBe(true);
    expect(useAppStore.getState().currentScreen).toBe('input');
    expect(useAppStore.getState().logEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Operation cancelled by user.', type: 'warning' }),
      ]),
    );
  });
});
