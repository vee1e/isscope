import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReportScreen } from './ReportScreen';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../store/appStore';
import React from 'react';

vi.mock('../components/layout/SplitPane', () => ({
  SplitPane: ({ left, right }: any) => (
    <div data-testid="split-pane">
      <div data-testid="left-pane">{left}</div>
      <div data-testid="right-pane">{right}</div>
    </div>
  ),
}));

vi.mock('../components/issue/IssueList', () => ({
  IssueList: ({ issues, selectedId, onSelect, onSearchChange }: any) => (
    <div data-testid="issue-list">
      <button data-testid="search-btn" onClick={() => onSearchChange('test search')} />
      {issues.map((i: any) => (
        <div
          key={i.number}
          data-testid={`issue-item-${i.number}`}
          onClick={() => onSelect(i.number)}
        >
          {i.title} {selectedId === i.number ? '(Selected)' : ''}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../components/issue/IssueDetail', () => ({
  IssueDetail: ({ issue }: any) => (
    <div data-testid="issue-detail">{issue ? `Detail: ${issue.title}` : 'No issue selected'}</div>
  ),
}));

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

const mockExportToMarkdown = vi.fn().mockReturnValue('mock markdown');
const mockDownloadMarkdown = vi.fn();

vi.mock('../lib/utils/exporters', () => ({
  exportToMarkdown: (...args: any[]) => mockExportToMarkdown(...args),
  downloadMarkdown: (...args: any[]) => mockDownloadMarkdown(...args),
}));

describe('ReportScreen', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    useAppStore.getState().setRepoInput('test/repo');
    useAppStore
      .getState()
      .setIssues([
        {
          number: 1,
          title: 'First Issue',
          user: { login: 'u1' },
          labels: [{ name: 'bug' }],
          body: 'body 1',
        } as any,
        {
          number: 2,
          title: 'Second Issue',
          user: { login: 'u2' },
          labels: [{ name: 'enhancement' }],
          body: 'body 2',
        } as any,
      ]);
    useAppStore.getState().setAnalyses(
      new Map([
        [1, { doability_score: 90, summary: 'easy' } as any],
        [2, { doability_score: 50, summary: 'hard' } as any],
      ]),
    );
    mockExportToMarkdown.mockClear();
    mockDownloadMarkdown.mockClear();
  });

  it('renders report screen with ranked issues', () => {
    render(<ReportScreen />);

    expect(screen.getByText('Report: test/repo')).toBeInTheDocument();
    expect(screen.getByTestId('split-pane')).toBeInTheDocument();
    expect(screen.getByTestId('issue-item-1')).toHaveTextContent('First Issue (Selected)');
    expect(screen.getByTestId('issue-item-2')).toHaveTextContent('Second Issue');
    expect(screen.getByTestId('issue-detail')).toHaveTextContent('Detail: First Issue');
  });

  it('selects issue correctly', () => {
    render(<ReportScreen />);

    const secondIssue = screen.getByTestId('issue-item-2');
    fireEvent.click(secondIssue);

    expect(secondIssue).toHaveTextContent('Second Issue (Selected)');
    expect(screen.getByTestId('issue-detail')).toHaveTextContent('Detail: Second Issue');
  });

  it('handles search correctly', () => {
    render(<ReportScreen />);

    // Initially both issues shown
    expect(screen.getByTestId('issue-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('issue-item-2')).toBeInTheDocument();

    act(() => {
      useAppStore.getState().setSearchQuery('Second');
    });

    expect(screen.queryByTestId('issue-item-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('issue-item-2')).toBeInTheDocument();
  });

  it('exports to markdown', () => {
    render(<ReportScreen />);

    const exportBtn = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportBtn);

    expect(mockExportToMarkdown).toHaveBeenCalled();
    expect(mockDownloadMarkdown).toHaveBeenCalledWith(
      'mock markdown',
      'isscope-report-test-repo.md',
    );

    expect(useAppStore.getState().logEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Report exported as Markdown.', type: 'success' }),
      ]),
    );
  });

  it('handles new analysis action', () => {
    render(<ReportScreen />);

    const newBtn = screen.getByRole('button', { name: /New/i });
    fireEvent.click(newBtn);

    expect(useAppStore.getState().repoInput).toBe('');
    expect(useAppStore.getState().currentScreen).toBe('input');
  });
});
