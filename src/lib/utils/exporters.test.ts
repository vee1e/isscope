import { describe, expect, it } from 'vitest';
import type { RankedIssue } from '../types';
import { exportToCSV } from './exporters';

function issue(overrides: Partial<RankedIssue> = {}): RankedIssue {
  return {
    number: 42,
    title: 'Fix CSV, quotes, and newlines',
    body: null,
    user: {
      login: 'octocat',
      avatar_url: '',
      html_url: 'https://github.com/octocat',
    },
    labels: [],
    assignees: [],
    comments_count: 0,
    created_at: '2026-05-12T00:00:00Z',
    updated_at: '2026-05-12T00:00:00Z',
    html_url: 'https://github.com/owner/repo/issues/42',
    state: 'open',
    score: 88,
    analysis: {
      summary: 'Small CSV export task',
      status: 'active',
      progress_estimate: 'not_started',
      is_actionable_code_change: true,
      not_mergeable_reason: null,
      complexity: 2,
      skills_required: ['TypeScript', 'CSV'],
      newcomer_friendliness: 4,
      doability_score: 88,
      analysis_notes: 'Ready to implement',
    },
    ...overrides,
  };
}

describe('exportToCSV', () => {
  it('includes a UTF-8 BOM and CRLF row endings for spreadsheet compatibility', () => {
    const csv = exportToCSV([issue()]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('\r\n');
    expect(csv).not.toContain('\nRank');
  });

  it('escapes commas, quotes, and newlines in CSV cells', () => {
    const csv = exportToCSV([
      issue({
        title: 'Fix "quoted", multiline\ntitle',
      }),
    ]);

    expect(csv).toContain('"Fix ""quoted"", multiline\ntitle"');
  });
});
