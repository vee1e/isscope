import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTimestamp,
  formatTimeAgo,
  truncate,
  complexityLabel,
  friendlinessLabel,
  progressLabel,
  statusLabel,
} from './formatters';

describe('formatters utilities', () => {
  // ── formatTimestamp ─────────────────────────────
  it('formats ISO date correctly', () => {
    expect(formatTimestamp('2024-01-15T12:00:00Z')).toBe('Jan 15, 2024');
  });

  // ── formatTimeAgo ───────────────────────────────
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns just now for current time', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    expect(formatTimeAgo(now.toISOString())).toBe('just now');
  });

  it('returns minutes ago correctly', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const past = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(past)).toBe('5m ago');
  });

  // ── truncate ────────────────────────────────────
  it('does not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long strings', () => {
    expect(truncate('hello world', 6)).toBe('hello…');
  });

  // ── complexityLabel ─────────────────────────────
  it('returns correct complexity label', () => {
    expect(complexityLabel(2)).toBe('Simple');
  });

  it('returns fallback for invalid index', () => {
    expect(complexityLabel(99)).toBe('—');
  });

  // ── friendlinessLabel ───────────────────────────
  it('returns correct friendliness label', () => {
    expect(friendlinessLabel(5)).toBe('Great First Issue');
  });

  it('returns fallback for invalid index', () => {
    expect(friendlinessLabel(-1)).toBe('—');
  });

  // ── progressLabel ───────────────────────────────
  it('maps progress correctly', () => {
    expect(progressLabel('midway')).toBe('In Progress');
  });

  it('returns original value if key not found', () => {
    expect(progressLabel('unknown')).toBe('unknown');
  });

  // ── statusLabel ─────────────────────────────────
  it('maps status correctly', () => {
    expect(statusLabel('active')).toBe('Active');
  });

  it('returns original value if key not found', () => {
    expect(statusLabel('random')).toBe('random');
  });
});
