// ── Formatters ────────────────────────────────────

/**
 * Formats an ISO timestamp as a short US date string.
 *
 * @param iso - ISO timestamp to format.
 * @returns A localized date such as "Jan 1, 2026".
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Converts an ISO timestamp into a compact relative time label.
 *
 * @param iso - ISO timestamp to compare against the current time.
 * @returns A relative label such as "3h ago", or "just now" for recent times.
 */
export function formatTimeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return 'just now';
}

/**
 * Shortens text to a maximum length and appends an ellipsis when truncated.
 *
 * @param str - Text to shorten.
 * @param maxLen - Maximum number of characters in the returned string.
 * @returns The original text when short enough, otherwise a truncated version.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Maps a numeric complexity score to a human-readable label.
 *
 * @param n - Complexity score from the issue metadata.
 * @returns The matching complexity label, or an em dash for unknown scores.
 */
export function complexityLabel(n: number): string {
  const labels = ['—', 'Trivial', 'Simple', 'Moderate', 'Complex', 'Major Rewrite'];
  return labels[n] || '—';
}

/**
 * Maps a numeric contributor-friendliness score to a readable label.
 *
 * @param n - Friendliness score from the issue metadata.
 * @returns The matching friendliness label, or an em dash for unknown scores.
 */
export function friendlinessLabel(n: number): string {
  const labels = [
    '—',
    'Expert Only',
    'Advanced',
    'Intermediate',
    'Beginner Friendly',
    'Great First Issue',
  ];
  return labels[n] || '—';
}

/**
 * Converts an issue progress value into display text.
 *
 * @param p - Stored progress value.
 * @returns A readable progress label, or the original value when unmapped.
 */
export function progressLabel(p: string): string {
  const map: Record<string, string> = {
    not_started: 'Not Started',
    early: 'Early Stage',
    midway: 'In Progress',
    nearly_done: 'Nearly Done',
  };
  return map[p] || p;
}

/**
 * Converts an issue status value into display text.
 *
 * @param s - Stored status value.
 * @returns A readable status label, or the original value when unmapped.
 */
export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    active: 'Active',
    stale: 'Stale',
    discussion: 'Discussion',
    external: 'External Dep',
    wontfix: "Won't Fix",
  };
  return map[s] || s;
}
