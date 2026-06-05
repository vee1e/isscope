import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToMarkdown, downloadMarkdown } from './exporters';
import type { RankedIssue } from '../types';

describe('exporters utilities', () => {
  describe('exportToMarkdown', () => {
    const mockRepo = 'owner/repo';
    const mockIssues: RankedIssue[] = [
      {
        number: 42,
        title: 'Fix overlapping footer text',
        body: 'The footer overlaps the content on mobile.',
        user: { login: 'author-user', avatar_url: '', html_url: '' },
        labels: [{ name: 'bug', color: 'red' }],
        assignees: [],
        comments_count: 3,
        created_at: '2026-05-18T10:00:00Z',
        updated_at: '2026-05-18T10:30:00Z',
        html_url: 'https://github.com/owner/repo/issues/42',
        state: 'open',
        score: 85,
        analysis: {
          summary: 'A simple CSS bug with absolute layout.',
          status: 'active',
          progress_estimate: 'midway',
          complexity: 1,
          skills_required: ['CSS', 'HTML'],
          newcomer_friendliness: 5,
          doability_score: 85,
          analysis_notes: 'Highly recommended for newcomers.',
          is_actionable_code_change: true,
          not_mergeable_reason: null,
        },
      },
      {
        number: 43,
        title: 'Add new login feature',
        body: null, // null body
        user: { login: 'aarya', avatar_url: '', html_url: '' },
        labels: [], // no labels
        assignees: [],
        comments_count: 0,
        created_at: '2026-05-18T11:00:00Z',
        updated_at: '2026-05-18T11:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/43',
        state: 'open',
        score: 50,
        analysis: undefined, // no analysis
      },
    ];

    it('generates a report with correct headers and summary table', () => {
      const markdown = exportToMarkdown(mockIssues, mockRepo);

      // Verify general metadata
      expect(markdown).toContain(`# Isscope Report — ${mockRepo}`);
      expect(markdown).toContain('Total issues analyzed: 2');

      // Verify Summary Table Headers
      expect(markdown).toContain('| Rank | # | Title | Score | Status | Complexity |');

      // Verify issue 42 row in table
      expect(markdown).toContain(
        '| 1 | #42 | Fix overlapping footer text | 85/100 | Active | Trivial |',
      );

      // Verify issue 43 row in table (with fallbacks since no analysis)
      expect(markdown).toContain('| 2 | #43 | Add new login feature | 50/100 | — | — |');
    });

    it('generates detailed sections for each issue correctly', () => {
      const markdown = exportToMarkdown(mockIssues, mockRepo);

      // Detailed issue 42
      expect(markdown).toContain('## #42 — Fix overlapping footer text');
      expect(markdown).toContain('- **Doability Score**: 85/100');
      expect(markdown).toContain('- **URL**: https://github.com/owner/repo/issues/42');
      expect(markdown).toContain('- **Author**: @author-user');
      expect(markdown).toContain('- **Labels**: bug');
      expect(markdown).toContain('- **Status**: Active');
      expect(markdown).toContain('- **Progress**: In Progress');
      expect(markdown).toContain('- **Complexity**: Trivial (1/5)');
      expect(markdown).toContain('- **Newcomer Friendliness**: Great First Issue (5/5)');
      expect(markdown).toContain('- **Skills Required**: CSS, HTML');
      expect(markdown).toContain('- **Actionable Code Change**: Yes');
      expect(markdown).toContain('> A simple CSS bug with absolute layout.');
      expect(markdown).toContain('**Notes**: Highly recommended for newcomers.');

      // Detailed issue 43
      expect(markdown).toContain('## #43 — Add new login feature');
      expect(markdown).toContain('- **Author**: @aarya');
      expect(markdown).toContain('- **Labels**: none');
    });

    it('handles empty issues array cleanly', () => {
      const markdown = exportToMarkdown([], mockRepo);
      expect(markdown).toContain(`# Isscope Report — ${mockRepo}`);
      expect(markdown).toContain('Total issues analyzed: 0');
    });
  });

  describe('downloadMarkdown', () => {
    let mockClick: any;
    let mockLink: any;

    beforeEach(() => {
      mockClick = vi.fn();
      mockLink = {
        href: '',
        download: '',
        click: mockClick,
      };

      // Stub DOM globals using a constructible function for Blob
      vi.stubGlobal(
        'Blob',
        vi.fn().mockImplementation(function (this: any, content: any[], options: any) {
          this.content = content;
          this.options = options;
          return this;
        }),
      );
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:mocked-url'),
        revokeObjectURL: vi.fn(),
      });
      vi.stubGlobal('document', {
        createElement: vi.fn((tag) => {
          if (tag === 'a') return mockLink;
          return {};
        }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('creates a download link, clicks it, and revokes url', () => {
      downloadMarkdown('# Sample Markdown', 'report.md');

      // Verify Blob is created with content
      expect(globalThis.Blob).toHaveBeenCalledWith(['# Sample Markdown'], {
        type: 'text/markdown',
      });

      // Verify createObjectURL is called with the blob
      expect(URL.createObjectURL).toHaveBeenCalled();

      // Verify anchor creation and custom properties
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:mocked-url');
      expect(mockLink.download).toBe('report.md');

      // Verify simulated click
      expect(mockClick).toHaveBeenCalled();

      // Verify URL clean up
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mocked-url');
    });
  });
});
