import { render, screen } from '@testing-library/react';
import { IssueMetadata } from './IssueMetadata';
import { describe, it, expect } from 'vitest';
import type { AnalysisResult } from '../../lib/types';
import React from 'react';

const mockAnalysis: AnalysisResult = {
  summary: 'This is a summary',
  status: 'active',
  progress_estimate: 'early',
  is_actionable_code_change: true,
  not_mergeable_reason: null,
  complexity: 3,
  skills_required: ['React', 'TypeScript'],
  newcomer_friendliness: 4,
  doability_score: 80,
  analysis_notes: 'Some notes',
};

describe('IssueMetadata component', () => {
  it('renders all analysis metrics correctly', () => {
    render(<IssueMetadata analysis={mockAnalysis} />);

    expect(screen.getByText('Doability')).toBeInTheDocument();
    expect(screen.getByText('80/100')).toBeInTheDocument();

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    expect(screen.getByText('Complexity')).toBeInTheDocument();
    expect(screen.getByText(/Moderate/)).toBeInTheDocument();

    expect(screen.getByText('Friendliness')).toBeInTheDocument();
    expect(screen.getByText(/Beginner Friendly/)).toBeInTheDocument();

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders merge blocker when not_mergeable_reason is provided', () => {
    const analysisWithBlocker: AnalysisResult = {
      ...mockAnalysis,
      not_mergeable_reason: 'Missing details',
    };
    render(<IssueMetadata analysis={analysisWithBlocker} />);

    expect(screen.getByText('Blocker')).toBeInTheDocument();
    expect(screen.getByText('Missing details')).toBeInTheDocument();
  });

  it('renders "none specified" when skills_required is empty', () => {
    const analysisNoSkills: AnalysisResult = {
      ...mockAnalysis,
      skills_required: [],
    };
    render(<IssueMetadata analysis={analysisNoSkills} />);

    expect(screen.getByText('none specified')).toBeInTheDocument();
  });
});
