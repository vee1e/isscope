import { render, screen } from '@testing-library/react';
import { IssueDetail } from './IssueDetail';
import { describe, it, expect } from 'vitest';
import type { RankedIssue } from '../../lib/types';
import React from 'react';

const mockIssue: RankedIssue = {
  number: 101,
  title: 'Fix styling of buttons',
  body: 'Please fix the styled buttons on the home screen.',
  updated_at: new Date().toISOString(),
  score: 90,
  user: { login: 'github_user', avatar_url: '', html_url: '' },
  labels: [{ name: 'ui-bug', color: 'ff0000' }],
  assignees: [],
  comments_count: 1,
  created_at: new Date().toISOString(),
  html_url: 'https://github.com/example/repo/issues/101',
  state: 'open',
  analysis: {
    summary: 'Simple styling adjustment.',
    status: 'active',
    progress_estimate: 'early',
    is_actionable_code_change: true,
    not_mergeable_reason: null,
    complexity: 1,
    skills_required: ['CSS'],
    newcomer_friendliness: 5,
    doability_score: 95,
    analysis_notes: 'Notes here.',
  },
  comments: [
    {
      id: 1,
      user: { login: 'commenter', avatar_url: '', html_url: '' },
      body: 'I will take a look.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

describe('IssueDetail component', () => {
  it('renders select issue placeholder when issue is null', () => {
    render(<IssueDetail issue={null} />);
    expect(screen.getByText('Select an issue to view details')).toBeInTheDocument();
  });

  it('renders all details when issue is provided', () => {
    render(<IssueDetail issue={mockIssue} />);

    expect(screen.getByText('#101 — Fix styling of buttons')).toBeInTheDocument();
    expect(screen.getByText('github_user')).toBeInTheDocument();
    expect(screen.getByText('1 comment')).toBeInTheDocument();
    expect(screen.getByText('ui-bug')).toBeInTheDocument();

    // AI Analysis section
    expect(screen.getByText('Simple styling adjustment.')).toBeInTheDocument();
    expect(screen.getByText('Notes here.')).toBeInTheDocument();

    // Comments section
    expect(screen.getByText('@commenter')).toBeInTheDocument();
    expect(screen.getByText('I will take a look.')).toBeInTheDocument();

    // Issue Body
    expect(
      screen.getByText('Please fix the styled buttons on the home screen.'),
    ).toBeInTheDocument();
  });
});
