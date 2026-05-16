// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { historyService } from './historyService';

async function resetHistoryService() {
  (globalThis as any).indexedDB = new IDBFactory();
  const svc = historyService as any;
  if (svc.db) {
    try {
      svc.db.close();
    } catch {
      /* ignore */
    }
  }
  svc.db = null;
  svc.initPromise = null;
}

const BASE_ISSUE = {
  number: 1,
  title: 'Test Issue',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  comments: [] as { created_at: string }[],
};

describe('historyService', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await resetHistoryService();
  });

  describe('shouldUseHistory', () => {
    it('returns false when no history exists', async () => {
      const result = await historyService.shouldUseHistory('owner', 'repo-none', []);
      expect(result.useHistory).toBe(false);
      expect(result.reason).toBe('No history found');
    });

    it('returns true immediately after saving', async () => {
      await historyService.saveToHistory('owner', 'repo-fresh', [BASE_ISSUE], new Map());
      const result = await historyService.shouldUseHistory('owner', 'repo-fresh', [BASE_ISSUE]);
      expect(result.useHistory).toBe(true);
      expect(result.historyData?.issues.length).toBe(1);
    });

    it('invalidates when issue count grows beyond tolerance', async () => {
      await historyService.saveToHistory('owner', 'repo-grow', [BASE_ISSUE], new Map());
      const moreIssues = [1, 2, 3, 4].map((n) => ({ ...BASE_ISSUE, number: n }));
      const result = await historyService.shouldUseHistory('owner', 'repo-grow', moreIssues);
      expect(result.useHistory).toBe(false);
    });

    it('keeps low-activity repos valid for up to 24 hours', async () => {
      const lowActivityIssues = [{ ...BASE_ISSUE, created_at: '2023-01-01T00:00:00Z' }];
      await historyService.saveToHistory('owner', 'repo-low', lowActivityIssues, new Map());
      vi.setSystemTime(Date.now() + 23 * 60 * 60 * 1000);
      const result = await historyService.shouldUseHistory('owner', 'repo-low', lowActivityIssues);
      expect(result.useHistory).toBe(true);
    });

    it('expires high-activity repos after 30 minutes', async () => {
      const now = Date.now();
      const highActivityIssues = Array.from({ length: 11 }, (_, i) => ({
        ...BASE_ISSUE,
        number: i + 1,
        created_at: new Date(now - i * 60 * 60 * 1000).toISOString(),
      }));
      await historyService.saveToHistory('owner', 'repo-high', highActivityIssues, new Map());
      vi.setSystemTime(now + 31 * 60 * 1000);
      const result = await historyService.shouldUseHistory(
        'owner',
        'repo-high',
        highActivityIssues,
      );
      expect(result.useHistory).toBe(false);
      expect(result.reason).toBe('History expired based on activity');
    });
  });

  describe('saveToHistory', () => {
    it('persists metadata with correct owner and repo', async () => {
      await historyService.saveToHistory('acme', 'widgets', [BASE_ISSUE], new Map());
      const all = await historyService.getAllHistory();
      expect(all).toHaveLength(1);
      expect(all[0].metadata.owner).toBe('acme');
      expect(all[0].metadata.repo).toBe('widgets');
      expect(all[0].metadata.issueCount).toBe(1);
    });

    it('overwrites an existing entry for the same repo', async () => {
      await historyService.saveToHistory('owner', 'repo-ow', [BASE_ISSUE], new Map());
      const updated = [BASE_ISSUE, { ...BASE_ISSUE, number: 2 }];
      await historyService.saveToHistory('owner', 'repo-ow', updated, new Map());
      const all = await historyService.getAllHistory();
      expect(all).toHaveLength(1);
      expect(all[0].metadata.issueCount).toBe(2);
    });

    it('stores analyses and retrieves them via getHistoryEntry', async () => {
      const analyses = new Map([[1, { summary: 'looks good' } as any]]);
      await historyService.saveToHistory('owner', 'repo-anal', [BASE_ISSUE], analyses);
      const entry = await historyService.getHistoryEntry('owner', 'repo-anal');
      expect(entry.valid).toBe(true);
      expect(entry.data?.analyses.get(1)).toEqual({ summary: 'looks good' });
    });
  });

  describe('shouldUseHistoryAnalysis', () => {
    it('returns false when repo has no history', async () => {
      const result = await historyService.shouldUseHistoryAnalysis(
        'owner',
        'repo-noana',
        1,
        BASE_ISSUE,
      );
      expect(result.useHistory).toBe(false);
      expect(result.reason).toBe('No history found');
    });

    it('returns cached analysis when issue is unchanged', async () => {
      const analysis = { summary: 'cached' } as any;
      await historyService.saveToHistory(
        'owner',
        'repo-cached',
        [BASE_ISSUE],
        new Map([[1, analysis]]),
      );
      const result = await historyService.shouldUseHistoryAnalysis(
        'owner',
        'repo-cached',
        1,
        BASE_ISSUE,
      );
      expect(result.useHistory).toBe(true);
      expect(result.historyAnalysis).toEqual(analysis);
    });

    it('invalidates analysis when issue gains more than 2 new comments', async () => {
      const issueWithComments = {
        ...BASE_ISSUE,
        comments: [{ created_at: '2024-01-01T01:00:00Z' }],
      };
      await historyService.saveToHistory(
        'owner',
        'repo-cmts',
        [issueWithComments],
        new Map([[1, { summary: 'old' } as any]]),
      );
      const freshIssue = {
        ...BASE_ISSUE,
        comments: [
          { created_at: '2024-01-01T01:00:00Z' },
          { created_at: '2024-01-02T00:00:00Z' },
          { created_at: '2024-01-03T00:00:00Z' },
          { created_at: '2024-01-04T00:00:00Z' },
        ],
      };
      const result = await historyService.shouldUseHistoryAnalysis(
        'owner',
        'repo-cmts',
        1,
        freshIssue,
      );
      expect(result.useHistory).toBe(false);
    });

    it('keeps analysis valid for issues inactive for over 90 days', async () => {
      const oldIssue = {
        ...BASE_ISSUE,
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      };
      await historyService.saveToHistory(
        'owner',
        'repo-old',
        [oldIssue],
        new Map([[1, { summary: 'stale but valid' } as any]]),
      );
      const result = await historyService.shouldUseHistoryAnalysis(
        'owner',
        'repo-old',
        1,
        oldIssue,
      );
      expect(result.useHistory).toBe(true);
    });
  });

  describe('updateHistoryAnalyses', () => {
    it('merges new analyses into existing history', async () => {
      await historyService.saveToHistory(
        'owner',
        'repo-merge',
        [BASE_ISSUE],
        new Map([[1, { summary: 'first' } as any]]),
      );
      await historyService.updateHistoryAnalyses(
        'owner',
        'repo-merge',
        new Map([[2, { summary: 'second' } as any]]),
      );
      const entry = await historyService.getHistoryEntry('owner', 'repo-merge');
      expect(entry.data?.analyses.get(1)).toEqual({ summary: 'first' });
      expect(entry.data?.analyses.get(2)).toEqual({ summary: 'second' });
    });

    it('throws when repo has no existing history', async () => {
      await expect(
        historyService.updateHistoryAnalyses('owner', 'repo-missing', new Map()),
      ).rejects.toThrow('Cannot update analyses: repository not in history');
    });
  });

  describe('deletion', () => {
    it('deleteFromHistory removes a specific repo entry', async () => {
      await historyService.saveToHistory('owner', 'repo-del', [BASE_ISSUE], new Map());
      await historyService.deleteFromHistory('owner', 'repo-del');
      const entry = await historyService.getHistoryEntry('owner', 'repo-del');
      expect(entry.valid).toBe(false);
    });

    it('clearAllHistory removes all entries', async () => {
      await historyService.saveToHistory('owner', 'repo-a', [BASE_ISSUE], new Map());
      await historyService.saveToHistory('owner', 'repo-b', [BASE_ISSUE], new Map());
      await historyService.clearAllHistory();
      const all = await historyService.getAllHistory();
      expect(all).toHaveLength(0);
    });
  });
});
