import { render, screen, fireEvent, act } from '@testing-library/react';
import { HistoryScreen } from './HistoryScreen';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import React from 'react';

describe('HistoryScreen', () => {
  beforeEach(() => {
    useAppStore.getState().reset();

    // Set up initial history mock
    useAppStore.setState({
      history: [
        {
          key: 'test/repo-1',
          fetchedAt: Date.now() - 3600000, // 1 hour ago
          metadata: {
            issueCount: 10,
            issuesActivity: { newIssuesPerDay: 0.5, lastIssueCreatedAt: Date.now() },
            commentsActivity: { newCommentsPerDay: 2, lastCommentCreatedAt: Date.now() },
          },
        },
        {
          key: 'test/repo-2',
          fetchedAt: Date.now() - 86400000, // 1 day ago
          metadata: {
            issueCount: 50,
            issuesActivity: { newIssuesPerDay: 5, lastIssueCreatedAt: Date.now() },
            commentsActivity: { newCommentsPerDay: 12, lastCommentCreatedAt: Date.now() },
          },
        },
      ] as any,
      isHistoryLoading: false,
      loadHistory: vi.fn(),
      deleteFromHistory: vi.fn(),
      clearAllHistory: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders history entries', () => {
    render(<HistoryScreen />);

    expect(screen.getByText('test/repo-1')).toBeInTheDocument();
    expect(screen.getByText('test/repo-2')).toBeInTheDocument();
    expect(screen.getByText('2 repositories')).toBeInTheDocument();
  });

  it('filters history by search query', () => {
    render(<HistoryScreen />);

    const searchInput = screen.getByPlaceholderText('Search repositories...');

    act(() => {
      fireEvent.change(searchInput, { target: { value: 'repo-1' } });
    });

    expect(screen.getByText('test/repo-1')).toBeInTheDocument();
    expect(screen.queryByText('test/repo-2')).not.toBeInTheDocument();
  });

  it('shows selected repository details', () => {
    render(<HistoryScreen />);

    const repo1 = screen.getByText('test/repo-1');
    act(() => {
      fireEvent.click(repo1);
    });

    expect(screen.getByText('[ Repository Details ]')).toBeInTheDocument();
    expect(screen.getByText('Total Issues')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // repo-1 issue count
  });

  it('calls clearAllHistory when clear all button is clicked and confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const clearAllMock = useAppStore.getState().clearAllHistory;

    render(<HistoryScreen />);

    const clearAllBtn = screen.getByRole('button', { name: /Clear All/i });
    act(() => {
      fireEvent.click(clearAllBtn);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(clearAllMock).toHaveBeenCalled();
  });

  it('navigates back to input screen', () => {
    render(<HistoryScreen />);

    const backBtn = screen.getByRole('button', { name: /Back/i });
    act(() => {
      fireEvent.click(backBtn);
    });

    expect(useAppStore.getState().currentScreen).toBe('input');
  });

  it('handles loading state', () => {
    useAppStore.setState({ isHistoryLoading: true });
    render(<HistoryScreen />);

    expect(screen.getByText('Loading history...')).toBeInTheDocument();
  });

  it('handles empty state', () => {
    useAppStore.setState({ history: [] });
    render(<HistoryScreen />);

    expect(screen.getByText('No history yet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Analyze Your First Repository/i }),
    ).toBeInTheDocument();
  });
});
