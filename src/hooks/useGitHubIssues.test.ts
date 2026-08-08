import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGitHubIssues } from './useGitHubIssues';
import { useAppStore } from '../store/appStore';
import * as github from '../lib/api/github';
import { historyService } from '../lib/history/historyService';

describe('useGitHubIssues', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      repoInput: 'owner/repo',
      maxIssues: 50,
      issues: [],
      analyses: new Map(),
    });

    vi.spyOn(github, 'searchIssues').mockResolvedValue([
      {
        number: 1,
        title: 'A',
        user: { login: 'u' },
        labels: [],
        assignees: [],
        comments: 0,
      },
    ] as any);
    vi.spyOn(github, 'fetchAllIssueDetails').mockImplementation(
      async (_owner: string, _repo: string, issues: any[]) => issues,
    );
    vi.spyOn(github, 'getRateLimitInfo').mockReturnValue({
      remaining: 5000,
      limit: 5000,
      reset: 0,
    });
    vi.spyOn(historyService, 'saveToHistory').mockResolvedValue(undefined);
    vi.spyOn(historyService, 'getAllHistory').mockResolvedValue([]);
  });

  it('preserves existing analyses when saving refreshed issues to history', async () => {
    vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
      valid: true,
      data: {
        key: 'owner/repo',
        issues: [],
        analyses: new Map([[1, { doability_score: 90 }]]) as any,
        metadata: {} as any,
        fetchedAt: Date.now(),
      },
    });

    const { result } = renderHook(() => useGitHubIssues());

    await act(async () => {
      await result.current.fetchIssues(true);
    });

    expect(historyService.saveToHistory).toHaveBeenCalledTimes(1);
    const savedAnalyses = (historyService.saveToHistory as any).mock.calls[0][3];
    expect(savedAnalyses.get(1)).toEqual({ doability_score: 90 });
  });

  it('saves an empty analyses map when no history entry exists yet', async () => {
    vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
      valid: false,
      reason: 'No history found',
    });

    const { result } = renderHook(() => useGitHubIssues());

    await act(async () => {
      await result.current.fetchIssues(true);
    });

    const savedAnalyses = (historyService.saveToHistory as any).mock.calls[0][3];
    expect(savedAnalyses.size).toBe(0);
  });
});
