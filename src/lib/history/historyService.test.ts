import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { historyService } from './historyService';
import type { Issue, AnalysisResult, HistoryEntry } from '../types';

describe('HistoryService', () => {
  let mockStore: any;

  // Helper to create mock IndexedDB request
  function createMockRequest(result?: any, error?: any) {
    const req: any = {};
    // Trigger onsuccess/onerror in the next tick to simulate IndexedDB micro/macro-task nature
    setTimeout(() => {
      if (error) {
        req.error = error;
        if (req.onerror) req.onerror();
      } else {
        req.result = result;
        if (req.onsuccess) req.onsuccess();
      }
    }, 0);
    return req;
  }

  beforeEach(() => {
    mockStore = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      getAll: vi.fn(),
    };

    // Spy on the private historyService methods to bypass IndexedDB connection
    vi.spyOn(historyService as any, 'init').mockResolvedValue(undefined);
    vi.spyOn(historyService as any, 'getStore').mockImplementation(() => mockStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getHistoryEntry', () => {
    it('returns valid: false when no entry exists in database', async () => {
      mockStore.get.mockImplementation(() => createMockRequest(undefined));

      const result = await historyService.getHistoryEntry('owner', 'repo');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('No history found');
      expect(mockStore.get).toHaveBeenCalledWith('owner/repo');
    });

    it('returns valid: true and reconstructs Map analyses when entry exists', async () => {
      const dbEntry = {
        key: 'owner/repo',
        issues: [],
        analyses: {
          '42': { doability_score: 90, summary: 'Trivial CSS issue' },
        },
        fetchedAt: 12345,
        metadata: {},
      };
      mockStore.get.mockImplementation(() => createMockRequest(dbEntry));

      const result = await historyService.getHistoryEntry('owner', 'repo');
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.analyses).toBeInstanceOf(Map);
      expect(result.data?.analyses.get(42)).toEqual({
        doability_score: 90,
        summary: 'Trivial CSS issue',
      });
    });
  });

  describe('shouldUseHistory (caching decisions)', () => {
    const freshIssues: Issue[] = [
      {
        number: 1,
        created_at: '2026-05-18T00:00:00Z',
        title: 'Issue 1',
        user: { login: 'user' },
      } as any,
    ];

    it('returns useHistory: false when no history is found', async () => {
      vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
        valid: false,
        reason: 'No history found',
      });

      const result = await historyService.shouldUseHistory('owner', 'repo', freshIssues);
      expect(result.useHistory).toBe(false);
      expect(result.reason).toBe('No history found');
    });

    it('allows using history for low-activity repos if fetched recently', async () => {
      const historyEntry: HistoryEntry = {
        key: 'owner/repo',
        issues: freshIssues,
        analyses: new Map(),
        fetchedAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
        metadata: {
          owner: 'owner',
          repo: 'repo',
          lastFetched: Date.now() - 1000 * 60 * 60 * 4,
          issueCount: 1,
          issuesActivity: {
            newIssuesPerDay: 0.1, // low activity
            lastIssueCreatedAt: freshIssues[0].created_at,
            sampleSize: 1,
          },
          commentsActivity: { newCommentsPerDay: 0, lastCommentCreatedAt: '', sampleSize: 0 },
        },
      };

      vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
        valid: true,
        data: historyEntry,
      });

      const result = await historyService.shouldUseHistory('owner', 'repo', freshIssues);
      expect(result.useHistory).toBe(true);
      expect(result.reason).toBe('History is fresh');
    });

    it('disallows history for high-activity repos if fetched 4 hours ago', async () => {
      const historyEntry: HistoryEntry = {
        key: 'owner/repo',
        issues: freshIssues,
        analyses: new Map(),
        fetchedAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago (which is > 30 minutes)
        metadata: {
          owner: 'owner',
          repo: 'repo',
          lastFetched: Date.now() - 1000 * 60 * 60 * 4,
          issueCount: 1,
          issuesActivity: {
            newIssuesPerDay: 15, // highly active repo (>10 issues/day)
            lastIssueCreatedAt: freshIssues[0].created_at,
            sampleSize: 1,
          },
          commentsActivity: { newCommentsPerDay: 0, lastCommentCreatedAt: '', sampleSize: 0 },
        },
      };

      vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
        valid: true,
        data: historyEntry,
      });

      const result = await historyService.shouldUseHistory('owner', 'repo', freshIssues);
      expect(result.useHistory).toBe(false);
      expect(result.reason).toBe('History expired based on activity');
    });
  });

  describe('shouldUseHistoryAnalysis (individual analysis decisions)', () => {
    const mockAnalysis: AnalysisResult = {
      summary: 'Analysis',
      status: 'active',
      complexity: 2,
      doability_score: 80,
      newcomer_friendliness: 4,
      skills_required: [],
      is_actionable_code_change: true,
      not_mergeable_reason: null,
      progress_estimate: 'not_started',
      analysis_notes: '',
    };

    const makeHistoryEntry = (
      issueComments: any[],
      fetchedAtOffset = 1000 * 60 * 60,
    ): HistoryEntry => ({
      key: 'owner/repo',
      issues: [
        {
          number: 42,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          comments: issueComments,
        } as any,
      ],
      analyses: new Map([[42, mockAnalysis]]),
      fetchedAt: Date.now() - fetchedAtOffset,
      metadata: {
        owner: 'owner',
        repo: 'repo',
        lastFetched: Date.now() - fetchedAtOffset,
        issueCount: 1,
        issuesActivity: { newIssuesPerDay: 0.1, lastIssueCreatedAt: '', sampleSize: 1 },
        commentsActivity: { newCommentsPerDay: 1, lastCommentCreatedAt: '', sampleSize: 1 },
      },
    });

    it('returns useHistory: true if no new comments are added and analysis is fresh', async () => {
      const historyEntry = makeHistoryEntry([{ id: 1, created_at: '2026-05-01T12:00:00Z' }]);
      vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
        valid: true,
        data: historyEntry,
      });

      const freshIssue: Issue = {
        number: 42,
        updated_at: '2026-05-01T12:00:00Z',
        comments: [{ id: 1, created_at: '2026-05-01T12:00:00Z' }],
      } as any;

      const result = await historyService.shouldUseHistoryAnalysis('owner', 'repo', 42, freshIssue);
      expect(result.useHistory).toBe(true);
      expect(result.historyAnalysis).toEqual(mockAnalysis);
    });

    it('returns useHistory: false if new comments exceed tolerance limit', async () => {
      // History has 1 comment
      const historyEntry = makeHistoryEntry([{ id: 1, created_at: '2026-05-01T12:00:00Z' }]);
      vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
        valid: true,
        data: historyEntry,
      });

      // Fresh issue has 4 comments (difference of 3, which is > 2)
      const freshIssue: Issue = {
        number: 42,
        updated_at: '2026-05-01T13:00:00Z',
        comments: [
          { id: 1, created_at: '2026-05-01T12:00:00Z' },
          { id: 2, created_at: '2026-05-01T12:30:00Z' },
          { id: 3, created_at: '2026-05-01T12:45:00Z' },
          { id: 4, created_at: '2026-05-01T13:00:00Z' },
        ],
      } as any;

      const result = await historyService.shouldUseHistoryAnalysis('owner', 'repo', 42, freshIssue);
      expect(result.useHistory).toBe(false);
      expect(result.historyAnalysis).toBeUndefined();
    });

    it('returns useHistory: true indefinitely for old inactive issues (>90 days old) despite old analysis', async () => {
      const ninetyFiveDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 95;
      const historyEntry = makeHistoryEntry([], 1000 * 60 * 60 * 24 * 10); // fetched 10 days ago (usually active limit is 7 days)
      vi.spyOn(historyService, 'getHistoryEntry').mockResolvedValue({
        valid: true,
        data: historyEntry,
      });

      const freshIssue: Issue = {
        number: 42,
        created_at: new Date(ninetyFiveDaysAgo).toISOString(),
        updated_at: new Date(ninetyFiveDaysAgo).toISOString(),
        comments: [],
      } as any;

      const result = await historyService.shouldUseHistoryAnalysis('owner', 'repo', 42, freshIssue);
      expect(result.useHistory).toBe(true);
    });
  });

  describe('saveToHistory & IndexedDB mutations', () => {
    it('calculates issues and comments activity rates and saves to IndexedDB', async () => {
      mockStore.put.mockImplementation(() => createMockRequest());

      const mockIssues: Issue[] = [
        {
          number: 1,
          created_at: '2026-05-01T12:00:00Z',
          comments: [{ id: 1, created_at: '2026-05-02T12:00:00Z' }],
        } as any,
        {
          number: 2,
          created_at: '2026-05-11T12:00:00Z', // 10 days span
          comments: [],
        } as any,
      ];
      const mockAnalyses = new Map([[1, { doability_score: 95 } as any]]);

      await historyService.saveToHistory('owner', 'repo', mockIssues, mockAnalyses);

      expect(mockStore.put).toHaveBeenCalled();
      const savedEntry = mockStore.put.mock.calls[0][0];

      expect(savedEntry.key).toBe('owner/repo');
      expect(savedEntry.metadata.issueCount).toBe(2);
      // 2 issues spanning 10 days = 0.2 issues per day
      expect(savedEntry.metadata.issuesActivity.newIssuesPerDay).toBeCloseTo(0.2);
      // 1 comment / 30 default days = 0.033 comments per day
      expect(savedEntry.metadata.commentsActivity.newCommentsPerDay).toBeCloseTo(0.033);
      expect(savedEntry.analyses).toEqual({ '1': { doability_score: 95 } });
    });
  });

  describe('utility mutations', () => {
    it('deletes from history', async () => {
      mockStore.delete.mockImplementation(() => createMockRequest());
      await historyService.deleteFromHistory('owner', 'repo');
      expect(mockStore.delete).toHaveBeenCalledWith('owner/repo');
    });

    it('clears all history', async () => {
      mockStore.clear.mockImplementation(() => createMockRequest());
      await historyService.clearAllHistory();
      expect(mockStore.clear).toHaveBeenCalled();
    });
  });
});
