import { CONFIG } from '../constants';
import type { Issue, Comment, TimelineEvent } from '../types';

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubSearchItem[];
}

interface GitHubSearchItem {
  number: number;
  title: string;
  body: string | null;
  user: { login: string; avatar_url: string; html_url: string };
  labels: { name: string; color: string; description?: string }[];
  assignees: { login: string; avatar_url: string; html_url: string }[];
  comments: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  state: string;
  pull_request?: object;
}

interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset: number;
}

const rateLimitInfo: RateLimitInfo = {
  remaining: 5000,
  limit: 5000,
  reset: 0,
};

import { useAppStore } from '../../store/appStore';

function headers(): HeadersInit {
  const h: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  const token = useAppStore.getState().githubToken;

  if (token) {
    h.Authorization = `Bearer ${token}`;
  }

  return h;
}

function updateRateLimit(response: Response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  const reset = response.headers.get('X-RateLimit-Reset');

  if (remaining) {
    rateLimitInfo.remaining = parseInt(remaining, 10);
  }

  if (limit) {
    rateLimitInfo.limit = parseInt(limit, 10);
  }

  if (reset) {
    rateLimitInfo.reset = parseInt(reset, 10);
  }
}

export function getRateLimitInfo(): RateLimitInfo {
  return { ...rateLimitInfo };
}

async function fetchWithRetry(
  url: string,
  retries = 3,
  extraHeaders: HeadersInit = {},
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, {
      headers: {
        ...headers(),
        ...extraHeaders,
      },
    });

    updateRateLimit(response);

    if (response.status === 403 && rateLimitInfo.remaining <= 0) {
      const resetTime = rateLimitInfo.reset * 1000 - Date.now();
      const waitTime = Math.max(resetTime, 1000);

      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }

    if (response.status === 429) {
      const backoff = Math.pow(2, i) * 1000;

      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  throw new Error('Max retries exceeded for GitHub API');
}

export async function searchIssues(
  owner: string,
  repo: string,
  maxIssues: number,
  onProgress?: (message: string) => void,
): Promise<Issue[]> {
  const allIssues: Issue[] = [];
  let page = 1;
  let hasMore = true;

  onProgress?.(`Searching issues in ${owner}/${repo}...`);

  while (hasMore && allIssues.length < maxIssues) {
    const query = encodeURIComponent(`repo:${owner}/${repo} is:issue state:open -linked:pr`);

    const url =
      `${CONFIG.GITHUB_API_BASE}/search/issues?q=${query}` +
      `&per_page=${CONFIG.DEFAULT_PAGE_SIZE}` +
      `&page=${page}&sort=comments&order=asc`;

    const response = await fetchWithRetry(url);

    const data: GitHubSearchResponse = await response.json();

    const issues = data.items
      .filter((item) => !item.pull_request)
      .map(
        (item): Issue => ({
          number: item.number,
          title: item.title,
          body: item.body,
          user: item.user,
          labels: item.labels,
          assignees: item.assignees,
          comments_count: item.comments,
          created_at: item.created_at,
          updated_at: item.updated_at,
          html_url: item.html_url,
          state: item.state,
        }),
      );

    allIssues.push(...issues);

    onProgress?.(
      `Fetched page ${page}: ${allIssues.length}/${Math.min(
        data.total_count,
        maxIssues,
      )} issues (rate limit: ${rateLimitInfo.remaining})`,
    );

    hasMore =
      allIssues.length < data.total_count && issues.length > 0 && allIssues.length < maxIssues;

    page++;
  }

  const limitedIssues = allIssues.slice(0, maxIssues);

  if (allIssues.length > maxIssues) {
    onProgress?.(`Limited to ${maxIssues} issues (found ${allIssues.length} total)`);
  }

  return limitedIssues;
}

export async function fetchIssueComments(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<Comment[]> {
  const url =
    `${CONFIG.GITHUB_API_BASE}/repos/${owner}/${repo}` +
    `/issues/${issueNumber}/comments?per_page=100`;

  const response = await fetchWithRetry(url);

  const data = await response.json();

  return data.map(
    (c: Record<string, unknown>): Comment => ({
      id: c.id as number,
      user: c.user as Comment['user'],
      body: c.body as string,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
    }),
  );
}

export async function fetchIssueTimeline(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<TimelineEvent[]> {
  const url =
    `${CONFIG.GITHUB_API_BASE}/repos/${owner}/${repo}` +
    `/issues/${issueNumber}/timeline?per_page=100`;

  try {
    const response = await fetchWithRetry(url, 3, {
      Accept: 'application/vnd.github.mockingbird-preview+json',
    });

    const data: Record<string, unknown>[] = await response.json();

    return data.map(
      (e): TimelineEvent => ({
        event: e.event as string,
        created_at: e.created_at as string,
        actor: e.actor as TimelineEvent['actor'],
        source: e.source as TimelineEvent['source'],
        commit_id: e.commit_id as string | undefined,
        label: e.label as TimelineEvent['label'],
      }),
    );
  } catch {
    return [];
  }
}

export async function fetchIssueDetails(
  owner: string,
  repo: string,
  issue: Issue,
  onProgress?: (message: string) => void,
): Promise<Issue> {
  onProgress?.(`Fetching details for #${issue.number}: ${issue.title.slice(0, 50)}...`);

  const [comments, timeline] = await Promise.all([
    fetchIssueComments(owner, repo, issue.number),
    fetchIssueTimeline(owner, repo, issue.number),
  ]);

  return {
    ...issue,
    comments,
    timeline,
  };
}

// Concurrency-limited batch fetcher
export async function fetchAllIssueDetails(
  owner: string,
  repo: string,
  issues: Issue[],
  onProgress?: (current: number, total: number, message: string) => void,
  isCancelled?: () => boolean,
): Promise<Issue[]> {
  const CONCURRENCY = 10;

  const queue = [...issues];

  const resultsMap = new Map<number, Issue>();

  let completed = 0;

  const next = async (): Promise<void> => {
    if (isCancelled?.() || queue.length === 0) {
      return;
    }

    const issue = queue.shift();

    if (!issue) {
      return;
    }

    try {
      const detailed = await fetchIssueDetails(owner, repo, issue, () => {
        // Intentionally muted to avoid excessive parallel progress updates
      });

      if (!isCancelled?.()) {
        resultsMap.set(issue.number, detailed);

        completed++;

        onProgress?.(
          completed,
          issues.length,
          `Fetched details for ${completed}/${issues.length} issues`,
        );
      }
    } catch {
      resultsMap.set(issue.number, issue);

      completed++;
    }

    return next();
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, issues.length) }, () => next());

  await Promise.all(workers);

  return issues.map((i) => resultsMap.get(i.number) || i);
}
