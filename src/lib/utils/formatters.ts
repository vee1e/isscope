// ── Formatters ────────────────────────────────────

/**
 * Formats an ISO 8601 timestamp into a readable date string (e.g., "Jan 1, 2023").
 *
 * @param iso - The ISO 8601 timestamp string to format.
 * @returns A formatted date string in the 'en-US' locale.
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
 * Converts an ISO 8601 timestamp into a relative time string (e.g., "5d ago").
 *
 * @param iso - The ISO 8601 timestamp string.
 * @returns A human-readable relative time string.
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
 * Truncates a string to a specified maximum length, including the ellipsis.
 *
 * @param str - The string to truncate.
 * @param maxLen - The maximum allowed length of the output string, including the ellipsis character.
 * @returns The truncated string with an ellipsis, or the original string if it is short enough.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Returns a display label for a complexity score (1–5).
 *
 * @param n - The complexity score from 1 (Trivial) to 5 (Major Rewrite).
 * @returns The corresponding label string, or '—' if the score is out of range.
 */
export function complexityLabel(n: number): string {
  const labels = ['—', 'Trivial', 'Simple', 'Moderate', 'Complex', 'Major Rewrite'];
  return labels[n] || '—';
}

/**
 * Returns a display label for a newcomer-friendliness score (1–5).
 *
 * @param n - The friendliness score from 1 (Expert Only) to 5 (Great First Issue).
 * @returns The corresponding label string, or '—' if the score is out of range.
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
 * Converts a progress state key into a human-readable label.
 *
 * @param p - The progress state key (e.g., 'not_started', 'early').
 * @returns The corresponding display label, or the original key if not found.
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
 * Converts a status key into a human-readable label.
 *
 * @param s - The status key (e.g., 'active', 'stale').
 * @returns The corresponding display label, or the original key if not found.
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
