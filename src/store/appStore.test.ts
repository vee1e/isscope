import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from './appStore';
import { historyService } from '../lib/history/historyService';

describe('useAppStore (Zustand Global State)', () => {
  beforeEach(() => {
    // Reset Zustand store state to initial values before each test
    useAppStore.getState().reset();
    useAppStore.setState({ githubToken: '', openRouterKey: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with default values', () => {
      const state = useAppStore.getState();
      expect(state.currentScreen).toBe('input');
      expect(state.repoInput).toBe('');
      expect(state.isValidRepo).toBe(false);
      expect(state.githubToken).toBe('');
      expect(state.openRouterKey).toBe('');
      expect(state.issues).toEqual([]);
      expect(state.analyses).toBeInstanceOf(Map);
      expect(state.logEntries).toEqual([]);
      expect(state.isCancelled).toBe(false);
      expect(state.history).toEqual([]);
    });
  });

  describe('Actions & State Changes', () => {
    it('sets current screen correctly', () => {
      useAppStore.getState().setScreen('fetching');
      expect(useAppStore.getState().currentScreen).toBe('fetching');

      useAppStore.getState().setScreen('report');
      expect(useAppStore.getState().currentScreen).toBe('report');
    });

    it('sets and validates repo input correctly', () => {
      // Valid input
      useAppStore.getState().setRepoInput('owner/repo');
      expect(useAppStore.getState().repoInput).toBe('owner/repo');
      expect(useAppStore.getState().isValidRepo).toBe(true);

      // Invalid input
      useAppStore.getState().setRepoInput('justowner');
      expect(useAppStore.getState().repoInput).toBe('justowner');
      expect(useAppStore.getState().isValidRepo).toBe(false);
    });

    it('sets api keys correctly', () => {
      useAppStore.getState().setApiKeys({
        githubToken: 'gh_key',
        openRouterKey: 'or_key',
      });
      expect(useAppStore.getState().githubToken).toBe('gh_key');
      expect(useAppStore.getState().openRouterKey).toBe('or_key');
    });

    it('sets settings correctly within bounds', () => {
      // Default should be 20 or similar config value
      expect(useAppStore.getState().maxIssues).toBeDefined();

      // Set valid
      useAppStore.getState().setMaxIssues(10);
      expect(useAppStore.getState().maxIssues).toBe(10);

      // Set too low (below MIN_MAX_ISSUES, which is likely 1 or 5)
      useAppStore.getState().setMaxIssues(-5);
      expect(useAppStore.getState().maxIssues).toBeGreaterThanOrEqual(1);
    });

    it('sets fetch progress correctly', () => {
      useAppStore.getState().setFetchProgress({ phase: 'analyzing', current: 5, total: 10 });
      expect(useAppStore.getState().fetchProgress).toEqual({
        phase: 'analyzing',
        current: 5,
        total: 10,
      });
    });
  });

  describe('Issues and Analyses Sorting/Ranking', () => {
    const issue1: any = {
      number: 1,
      title: 'Issue 1',
      user: { login: 'u1' },
      labels: [],
      assignees: [],
    };
    const issue2: any = {
      number: 2,
      title: 'Issue 2',
      user: { login: 'u2' },
      labels: [],
      assignees: [],
    };

    it('adds single issue and sets list correctly', () => {
      useAppStore.getState().setIssues([issue1]);
      expect(useAppStore.getState().issues).toHaveLength(1);

      useAppStore.getState().addIssue(issue2);
      expect(useAppStore.getState().issues).toHaveLength(2);
      expect(useAppStore.getState().issues[1]).toEqual(issue2);
    });

    it('handles individual and batch analysis setters', () => {
      const mockResult: any = { doability_score: 90, summary: 'A' };
      useAppStore.getState().setAnalysis(1, mockResult);
      expect(useAppStore.getState().analyses.get(1)).toEqual(mockResult);

      const mockMap = new Map([[2, { doability_score: 70 } as any]]);
      useAppStore.getState().setAnalyses(mockMap);
      expect(useAppStore.getState().analyses.size).toBe(1);
      expect(useAppStore.getState().analyses.get(2)?.doability_score).toBe(70);
    });

    it('getRankedIssues returns issues mapped to score and sorted descending', () => {
      useAppStore.getState().setIssues([issue1, issue2]);

      const mockAnalyses = new Map([
        [1, { doability_score: 60 } as any],
        [2, { doability_score: 95 } as any], // issue 2 has higher score
      ]);
      useAppStore.getState().setAnalyses(mockAnalyses);

      const ranked = useAppStore.getState().getRankedIssues();

      expect(ranked).toHaveLength(2);
      // Issue 2 should be ranked 1st
      expect(ranked[0].number).toBe(2);
      expect(ranked[0].score).toBe(95);
      expect(ranked[0].analysis).toBeDefined();

      // Issue 1 should be ranked 2nd
      expect(ranked[1].number).toBe(1);
      expect(ranked[1].score).toBe(60);
    });
  });

  describe('Terminal Logs', () => {
    it('adds and clears logs correctly', () => {
      useAppStore.getState().addLog('First action', 'info');
      useAppStore.getState().addLog('Warning occurred', 'warning');

      const logs = useAppStore.getState().logEntries;
      expect(logs).toHaveLength(2);
      expect(logs[0].message).toBe('First action');
      expect(logs[0].type).toBe('info');
      expect(logs[1].message).toBe('Warning occurred');
      expect(logs[1].type).toBe('warning');
      expect(logs[0].timestamp).toBeDefined();

      useAppStore.getState().clearLogs();
      expect(useAppStore.getState().logEntries).toHaveLength(0);
    });
  });

  describe('History Interactions (IndexedDB Delegation)', () => {
    const mockHistoryMetadata = {
      owner: 'owner',
      repo: 'repo',
      lastFetched: 12345,
      issueCount: 1,
      issuesActivity: { newIssuesPerDay: 0.1, lastIssueCreatedAt: '', sampleSize: 1 },
      commentsActivity: { newCommentsPerDay: 0, lastCommentCreatedAt: '', sampleSize: 0 },
    };

    it('loadHistory loads and updates state', async () => {
      const mockHistoryList = [
        { key: 'owner/repo', metadata: mockHistoryMetadata, fetchedAt: 12345 },
      ];
      vi.spyOn(historyService, 'getAllHistory').mockResolvedValue(mockHistoryList);

      const store = useAppStore.getState();
      expect(store.isHistoryLoading).toBe(false);

      const promise = store.loadHistory();
      expect(useAppStore.getState().isHistoryLoading).toBe(true);

      await promise;
      expect(useAppStore.getState().isHistoryLoading).toBe(false);
      expect(useAppStore.getState().history).toEqual(mockHistoryList);
    });

    it('deleteFromHistory calls historyService and reloads history', async () => {
      vi.spyOn(historyService, 'deleteFromHistory').mockResolvedValue(undefined);
      vi.spyOn(historyService, 'getAllHistory').mockResolvedValue([]);

      await useAppStore.getState().deleteFromHistory('owner', 'repo');

      expect(historyService.deleteFromHistory).toHaveBeenCalledWith('owner', 'repo');
      expect(historyService.getAllHistory).toHaveBeenCalled();
      expect(useAppStore.getState().history).toEqual([]);
    });

    it('clearAllHistory calls historyService and clears history list', async () => {
      vi.spyOn(historyService, 'clearAllHistory').mockResolvedValue(undefined);

      await useAppStore.getState().clearAllHistory();

      expect(historyService.clearAllHistory).toHaveBeenCalled();
      expect(useAppStore.getState().history).toEqual([]);
    });
  });

  describe('Cancellation and Reset', () => {
    it('sets isCancelled to true on cancel()', () => {
      useAppStore.getState().cancel();
      expect(useAppStore.getState().isCancelled).toBe(true);
    });

    it('reset clears state back to defaults except API keys', () => {
      useAppStore.setState({
        currentScreen: 'report',
        repoInput: 'owner/repo',
        isValidRepo: true,
        issues: [{ number: 1 } as any],
        githubToken: 'keep-github-token',
        openRouterKey: 'keep-openrouter-key',
      });

      useAppStore.getState().reset();

      const state = useAppStore.getState();
      expect(state.currentScreen).toBe('input');
      expect(state.repoInput).toBe('');
      expect(state.isValidRepo).toBe(false);
      expect(state.issues).toEqual([]);
      // API Keys should be retained!
      expect(state.githubToken).toBe('keep-github-token');
      expect(state.openRouterKey).toBe('keep-openrouter-key');
    });
  });
});
