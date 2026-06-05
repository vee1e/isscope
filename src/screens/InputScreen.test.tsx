import { render, screen, fireEvent, act } from '@testing-library/react';
import { InputScreen } from './InputScreen';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import React from 'react';
import { historyService } from '../lib/history/historyService';

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../lib/history/historyService', () => ({
  historyService: {
    getHistoryEntry: vi.fn(),
    getAllHistory: vi.fn().mockResolvedValue([]),
  },
}));

describe('InputScreen', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders input screen and allows typing', () => {
    render(<InputScreen />);

    const input = screen.getByPlaceholderText('owner/repo [Cmd+K]');
    expect(input).toBeInTheDocument();

    act(() => {
      fireEvent.change(input, { target: { value: 'facebook/react' } });
    });

    expect(input).toHaveValue('facebook/react');
  });

  it('validates repository format before submission', () => {
    render(<InputScreen />);

    const input = screen.getByPlaceholderText('owner/repo [Cmd+K]');
    const submitBtn = screen.getByRole('button', { name: /Start Analysis/i });

    expect(submitBtn).toBeDisabled();

    act(() => {
      fireEvent.change(input, { target: { value: 'invalid-repo' } });
    });

    expect(submitBtn).toBeDisabled();

    act(() => {
      fireEvent.change(input, { target: { value: 'valid/repo' } });
    });

    expect(submitBtn).not.toBeDisabled();
  });

  it('submits valid repository and changes screen', () => {
    render(<InputScreen />);

    const input = screen.getByPlaceholderText('owner/repo [Cmd+K]');
    const submitBtn = screen.getByRole('button', { name: /Start Analysis/i });

    act(() => {
      fireEvent.change(input, { target: { value: 'valid/repo' } });
    });

    act(() => {
      fireEvent.click(submitBtn);
    });

    expect(useAppStore.getState().currentScreen).toBe('fetching');
    expect(useAppStore.getState().repoInput).toBe('valid/repo');
  });

  it('toggles API configuration panel', () => {
    render(<InputScreen />);

    const configBtn = screen.getByRole('button', { name: /Configure API Keys/i });

    act(() => {
      fireEvent.click(configBtn);
    });

    expect(screen.getByText('Hide API Configuration')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ghp_...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk-or-...')).toBeInTheDocument();
  });

  it('navigates to history screen', () => {
    render(<InputScreen />);

    const historyBtn = screen.getByRole('button', { name: /View History/i });
    act(() => {
      fireEvent.click(historyBtn);
    });

    expect(useAppStore.getState().currentScreen).toBe('history');
  });

  it('loads recent history correctly', async () => {
    const mockHistory = [
      {
        key: 'test/recent',
        fetchedAt: Date.now(),
        metadata: { issueCount: 5 },
      },
    ];

    vi.mocked(historyService.getAllHistory).mockResolvedValue(mockHistory as any);
    useAppStore.setState({
      history: mockHistory as any,
      loadHistory: vi.fn(),
    });

    render(<InputScreen />);

    const recentItem = screen.getByRole('button', { name: /test\/recent/i });
    expect(recentItem).toBeInTheDocument();

    // Setup history load mock
    const historyMock = vi.mocked(historyService.getHistoryEntry).mockResolvedValue({
      valid: true,
      data: { issues: [{ id: 1 }], analyses: [] },
    } as any);

    act(() => {
      fireEvent.click(recentItem);
    });

    // Wait for async actions to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(historyMock).toHaveBeenCalledWith('test', 'recent');
    expect(useAppStore.getState().currentScreen).toBe('report');
  });
});
