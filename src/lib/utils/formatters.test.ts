import { describe, it, expect } from 'vitest';
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
  it('formats ISO date correctly', () => {
    expect(formatTimestamp('2024-01-15T00:00:00Z')).toBe('Jan 15, 2024');
  });

  it('returns just now for current time', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe('just now');
  });

  it('returns minutes ago correctly', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(past)).toBe('5m ago');
  });

  it('does not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates long strings', () => {
    expect(truncate('hello world', 6)).toBe('hello…');
  });

  it('returns correct complexity label', () => {
    expect(complexityLabel(2)).toBe('Simple');
  });

  it('returns fallback complexity label', () => {
    expect(complexityLabel(99)).toBe('—');
  });

  it('returns correct friendliness label', () => {
    expect(friendlinessLabel(5)).toBe('Great First Issue');
  });

  it('maps progress correctly', () => {
    expect(progressLabel('midway')).toBe('In Progress');
  });

  it('maps status correctly', () => {
    expect(statusLabel('active')).toBe('Active');
  });
});
