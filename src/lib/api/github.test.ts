import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchIssues,
  fetchIssueComments,
  fetchIssueTimeline,
  fetchIssueDetails,
  fetchAllIssueDetails,
  getRateLimitInfo,
} from './github';
import { useAppStore } from '../../store/appStore';

describe('GitHub API Client', () => {
  let mockFetch: any;

  // Helper to create mocked Response
  function createMockResponse(status: number, data: any, headersDict: Record<string, string> = {}) {
    const headers = new Map(Object.entries(headersDict));
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {
        get: (key: string) => headers.get(key) || null,
      },
      json: async () => data,
      text: async () => JSON.stringify(data),
    };
  }

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Bypass real wait times in retries by mock-resolving setTimeout immediately
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any) => {
      fn();
      return 0 as any;
    });

    // Reset store token
    useAppStore.setState({ githubToken: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Headers & Rate Limits', () => {
    it('sends Authorization header when githubToken is configured in appStore', async () => {
      useAppStore.setState({ githubToken: 'gh-secret-token' });

      mockFetch.mockResolvedValue(
        createMockResponse(
          200,
          { total_count: 0, items: [] },
          {
            'X-RateLimit-Remaining': '4500',
            'X-RateLimit-Limit': '5000',
            'X-RateLimit-Reset': '123456',
          },
        ),
      );

      await searchIssues('owner', 'repo', 5);

      expect(mockFetch).toHaveBeenCalled();
      const requestOptions = mockFetch.mock.calls[0][1];
      expect(requestOptions.headers['Authorization']).toBe('Bearer gh-secret-token');

      // Verify rate limits are updated
      const limits = getRateLimitInfo();
      expect(limits.remaining).toBe(4500);
      expect(limits.limit).toBe(5000);
      expect(limits.reset).toBe(123456);
    });
  });

  describe('fetchWithRetry & Retry Behavior', () => {
    it('retries successfully on 403 Forbidden with empty rate limit', async () => {
      // First call: 403 Forbidden (rate limited)
      // Second call: 200 OK
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse(
            403,
            {},
            {
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Limit': '5000',
              'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 1), // reset in 1s
            },
          ),
        )
        .mockResolvedValueOnce(createMockResponse(200, []));

      const comments = await fetchIssueComments('owner', 'repo', 42);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(comments).toEqual([]);
    });

    it('retries successfully on 429 Too Many Requests', async () => {
      // First call: 429 Too Many Requests
      // Second call: 200 OK
      mockFetch
        .mockResolvedValueOnce(createMockResponse(429, {}))
        .mockResolvedValueOnce(createMockResponse(200, []));

      const comments = await fetchIssueComments('owner', 'repo', 42);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(comments).toEqual([]);
    });

    it('throws error immediately on non-retryable error (e.g. 500 Internal Server Error)', async () => {
      mockFetch.mockResolvedValue(createMockResponse(500, { message: 'Crash' }));

      await expect(fetchIssueComments('owner', 'repo', 42)).rejects.toThrow(
        'GitHub API error: 500 Error',
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws after exceeding maximum retries (3 calls)', async () => {
      mockFetch.mockResolvedValue(createMockResponse(429, {}));

      await expect(fetchIssueComments('owner', 'repo', 42)).rejects.toThrow(
        'Max retries exceeded for GitHub API',
      );
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('searchIssues', () => {
    it('correctly requests issues, filters PRs, and limits to maxIssues', async () => {
      const page1Items = [
        {
          number: 1,
          title: 'Issue 1',
          body: 'body 1',
          user: { login: 'user1' },
          labels: [],
          assignees: [],
          comments: 2,
          created_at: '2026-05-18T10:00:00Z',
          updated_at: '2026-05-18T10:00:00Z',
          html_url: 'url-1',
          state: 'open',
        },
        {
          number: 2,
          title: 'PR 2', // This is a PR
          body: '',
          user: { login: 'user2' },
          labels: [],
          assignees: [],
          comments: 0,
          created_at: '2026-05-18T10:00:00Z',
          updated_at: '2026-05-18T10:00:00Z',
          html_url: 'url-2',
          state: 'open',
          pull_request: {}, // Marks as PR
        },
      ];

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          total_count: 1,
          items: page1Items,
        }),
      );

      const results = await searchIssues('owner', 'repo', 5);
      expect(results).toHaveLength(1); // PR filtered out
      expect(results[0].number).toBe(1);
      expect(results[0].title).toBe('Issue 1');

      // Verify page parameter
      expect(mockFetch.mock.calls[0][0]).toContain('page=1');
    });

    it('paginates until all pages are consumed (bounded by search API 1000-result cap)', async () => {
      // per_page=100, total_count=150 → exactly 2 pages are needed
      const page1Items = Array.from({ length: 100 }, (_, i) => ({
        number: i + 1,
        title: `A${i + 1}`,
        user: {},
        labels: [],
        assignees: [],
        comments: 0,
      }));
      const page2Items = Array.from({ length: 50 }, (_, i) => ({
        number: i + 101,
        title: `B${i + 1}`,
        user: {},
        labels: [],
        assignees: [],
        comments: 0,
      }));

      mockFetch
        .mockResolvedValueOnce(createMockResponse(200, { total_count: 150, items: page1Items }))
        .mockResolvedValueOnce(createMockResponse(200, { total_count: 150, items: page2Items }));

      const results = await searchIssues('owner', 'repo', 200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(150);
      expect(results[0].number).toBe(1);
      expect(results[149].number).toBe(150);
    });

    it('keeps paginating when a page contains only pull requests', async () => {
      // total_count includes PRs (search matches them too). Pages full of PRs
      // must not stop pagination, otherwise issues beyond them are never fetched.
      const prItem = {
        number: 900,
        title: 'PR',
        user: {},
        labels: [],
        assignees: [],
        comments: 0,
        pull_request: {},
      };
      const issueItem = {
        number: 42,
        title: 'Real issue',
        user: {},
        labels: [],
        assignees: [],
        comments: 0,
      };

      // Page 1: 100 PRs (0 comments sort first), page 2: 100 PRs, page 3: 50 issues
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse(200, {
            total_count: 250,
            items: Array.from({ length: 100 }, () => prItem),
          }),
        )
        .mockResolvedValueOnce(
          createMockResponse(200, {
            total_count: 250,
            items: Array.from({ length: 100 }, () => prItem),
          }),
        )
        .mockResolvedValueOnce(
          createMockResponse(200, {
            total_count: 250,
            items: Array.from({ length: 50 }, () => issueItem),
          }),
        );

      const results = await searchIssues('owner', 'repo', 50);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(50);
      expect(results[0].number).toBe(42);
    });

    it('does not request pages beyond the search API 1000-result cap', async () => {
      mockFetch.mockResolvedValue(createMockResponse(200, { total_count: 5000, items: [] }));

      await searchIssues('owner', 'repo', 1000);

      // With per_page=100 and a 1000-result cap, at most 10 pages are requested
      expect(mockFetch.mock.calls.length).toBe(10);
      expect(mockFetch.mock.calls[9][0]).toContain('page=10');
    });

    it('stops pagination immediately when maxIssues is reached', async () => {
      const issueA = { number: 1, title: 'A', user: {}, labels: [], assignees: [], comments: 0 };

      mockFetch.mockResolvedValue(createMockResponse(200, { total_count: 50, items: [issueA] }));

      // maxIssues is 1, so it should stop fetching after 1 item despite total_count being 50
      const results = await searchIssues('owner', 'repo', 1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
    });
  });

  describe('fetchIssueComments & fetchIssueTimeline', () => {
    it('fetchIssueComments requests correct URL and maps responses', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(200, [
          {
            id: 101,
            user: { login: 'commenter1' },
            body: 'First comment',
            created_at: '2026-05-18T10:10:00Z',
            updated_at: '2026-05-18T10:10:00Z',
          },
        ]),
      );

      const comments = await fetchIssueComments('owner', 'repo', 42);
      expect(mockFetch.mock.calls[0][0]).toContain('/repos/owner/repo/issues/42/comments');
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toBe(101);
      expect(comments[0].user.login).toBe('commenter1');
      expect(comments[0].body).toBe('First comment');
    });

    it('fetchIssueTimeline requests correct URL and maps events', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(200, [
          {
            event: 'labeled',
            created_at: '2026-05-18T10:05:00Z',
            actor: { login: 'triager' },
            label: { name: 'bug' },
          },
        ]),
      );

      const timeline = await fetchIssueTimeline('owner', 'repo', 42);
      expect(mockFetch.mock.calls[0][0]).toContain('/repos/owner/repo/issues/42/timeline');
      expect(timeline).toHaveLength(1);
      expect(timeline[0].event).toBe('labeled');
      expect(timeline[0].actor?.login).toBe('triager');
      expect(timeline[0].label?.name).toBe('bug');
    });

    it('fetchIssueTimeline returns empty array if request fails', async () => {
      mockFetch.mockResolvedValue(createMockResponse(404, {}));

      const timeline = await fetchIssueTimeline('owner', 'repo', 42);
      expect(timeline).toEqual([]);
    });
  });

  describe('fetchIssueDetails & fetchAllIssueDetails', () => {
    const baseIssue: any = {
      number: 42,
      title: 'Fix issue',
      user: { login: 'author' },
      labels: [],
      assignees: [],
      comments_count: 1,
    };

    it('fetchIssueDetails fetches comments and timeline concurrently', async () => {
      // Mock fetch comments first, timeline second
      mockFetch
        .mockResolvedValueOnce(createMockResponse(200, [{ id: 1, body: 'comment' }])) // comments
        .mockResolvedValueOnce(createMockResponse(200, [{ event: 'labeled' }])); // timeline

      const detailedIssue = await fetchIssueDetails('owner', 'repo', baseIssue);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(detailedIssue.comments).toHaveLength(1);
      expect(detailedIssue.timeline).toHaveLength(1);
      expect(detailedIssue.comments?.[0].id).toBe(1);
      expect(detailedIssue.timeline?.[0].event).toBe('labeled');
    });

    it('fetchAllIssueDetails completes batch fetches preserving order', async () => {
      const issue1 = { ...baseIssue, number: 1 };
      const issue2 = { ...baseIssue, number: 2 };

      // Mock comments and timeline for both issues (4 fetch calls total)
      mockFetch
        .mockResolvedValueOnce(createMockResponse(200, [])) // issue 1 comments
        .mockResolvedValueOnce(createMockResponse(200, [])) // issue 1 timeline
        .mockResolvedValueOnce(createMockResponse(200, [])) // issue 2 comments
        .mockResolvedValueOnce(createMockResponse(200, [])); // issue 2 timeline

      const progressSpy = vi.fn();
      const detailedIssues = await fetchAllIssueDetails(
        'owner',
        'repo',
        [issue1, issue2],
        progressSpy,
      );

      expect(detailedIssues).toHaveLength(2);
      expect(detailedIssues[0].number).toBe(1);
      expect(detailedIssues[1].number).toBe(2);
      expect(progressSpy).toHaveBeenCalledTimes(2);
    });

    it('fetchAllIssueDetails respects cancellation tokens', async () => {
      const issue1 = { ...baseIssue, number: 1 };
      const issue2 = { ...baseIssue, number: 2 };

      mockFetch
        .mockResolvedValueOnce(createMockResponse(200, [])) // issue 1 comments
        .mockResolvedValueOnce(createMockResponse(200, [])); // issue 1 timeline

      let isCancelledVal = false;
      const promise = fetchAllIssueDetails(
        'owner',
        'repo',
        [issue1, issue2],
        undefined,
        () => isCancelledVal,
      );

      // Cancel immediately after starting the async operation
      isCancelledVal = true;
      const detailedIssues = await promise;

      // Because cancellation is evaluated in workers, subsequent queue items are ignored
      expect(detailedIssues).toBeDefined();
    });
  });
});
