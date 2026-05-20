import { render, screen, fireEvent } from '@testing-library/react';
import { IssueListItem } from './IssueListItem';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RankedIssue } from '../../lib/types';
import React from 'react';

const getMockIssue = (): RankedIssue => ({
  number: 101,
  title: 'Optimize database queries',
  body: null,
  updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  score: 95,
  user: { login: 'octocat', avatar_url: '', html_url: '' },
  labels: [],
  assignees: [],
  comments_count: 0,
  created_at: new Date(Date.now() - 7200000).toISOString(),
  html_url: '',
  state: 'open',
});

describe('IssueListItem component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders standard fields correctly', () => {
    const onClick = vi.fn();
    render(<IssueListItem issue={getMockIssue()} rank={1} isSelected={false} onClick={onClick} />);

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('Optimize database queries')).toBeInTheDocument();
    expect(screen.getByText('[95]')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });

  it('triggers onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IssueListItem issue={getMockIssue()} rank={1} isSelected={false} onClick={onClick} />);

    fireEvent.click(screen.getByText('Optimize database queries'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders status prefix tag when analysis exists', () => {
    const issueWithAnalysis: RankedIssue = {
      ...getMockIssue(),
      analysis: {
        summary: 'Discussion required',
        status: 'discussion',
        progress_estimate: 'not_started',
        is_actionable_code_change: false,
        not_mergeable_reason: null,
        complexity: 1,
        skills_required: [],
        newcomer_friendliness: 5,
        doability_score: 50,
        analysis_notes: '',
      },
    };

    render(
      <IssueListItem issue={issueWithAnalysis} rank={1} isSelected={false} onClick={vi.fn()} />,
    );
    expect(screen.getByText('[DISCUSSION]')).toBeInTheDocument();
  });
});
