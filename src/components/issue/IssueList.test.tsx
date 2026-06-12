import { render, screen, fireEvent } from '@testing-library/react';
import { IssueList } from './IssueList';
import { describe, it, expect, vi } from 'vitest';
import type { RankedIssue } from '../../lib/types';
import React from 'react';

const mockIssues: RankedIssue[] = [
  {
    number: 1,
    title: 'Bug in routing',
    body: null,
    updated_at: new Date().toISOString(),
    score: 80,
    user: { login: 'coder1', avatar_url: '', html_url: '' },
    labels: [{ name: 'bug', color: 'red' }],
    assignees: [],
    comments_count: 0,
    created_at: new Date().toISOString(),
    html_url: '',
    state: 'open',
  },
  {
    number: 2,
    title: 'Style updates for login page',
    body: null,
    updated_at: new Date().toISOString(),
    score: 60,
    user: { login: 'designer1', avatar_url: '', html_url: '' },
    labels: [{ name: 'design', color: 'blue' }],
    assignees: [],
    comments_count: 0,
    created_at: new Date().toISOString(),
    html_url: '',
    state: 'open',
  },
];

describe('IssueList component', () => {
  it('renders issues correctly', () => {
    render(
      <IssueList
        issues={mockIssues}
        selectedId={1}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        selectedIndex={0}
      />,
    );

    expect(screen.getByText('Bug in routing')).toBeInTheDocument();
    expect(screen.getByText('Style updates for login page')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('triggers onSearchChange when typing in search input', () => {
    const onSearchChange = vi.fn();
    render(
      <IssueList
        issues={mockIssues}
        selectedId={1}
        searchQuery=""
        onSearchChange={onSearchChange}
        onSelect={vi.fn()}
        selectedIndex={0}
      />,
    );

    const input = screen.getByPlaceholderText(/Search issues.../);
    fireEvent.change(input, { target: { value: 'routing' } });
    expect(onSearchChange).toHaveBeenCalledWith('routing');
  });

  it('filters issues based on searchQuery prop', () => {
    render(
      <IssueList
        issues={mockIssues}
        selectedId={1}
        searchQuery="routing"
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        selectedIndex={0}
      />,
    );

    expect(screen.getByText('Bug in routing')).toBeInTheDocument();
    expect(screen.queryByText('Style updates for login page')).not.toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();
  });

  it('triggers onSelect when an issue item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <IssueList
        issues={mockIssues}
        selectedId={1}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelect={onSelect}
        selectedIndex={0}
      />,
    );

    fireEvent.click(screen.getByText('Style updates for login page'));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('shows no issues found message when filtered list is empty', () => {
    render(
      <IssueList
        issues={mockIssues}
        selectedId={1}
        searchQuery="xyz"
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        selectedIndex={-1}
      />,
    );

    expect(screen.getByText('No issues match your search.')).toBeInTheDocument();
  });

  it('verifies that scrollIntoView is called on the selected item', () => {
    const scrollMock = vi.fn();
    const originalGetElementById = document.getElementById;
    document.getElementById = vi.fn().mockReturnValue({
      scrollIntoView: scrollMock,
    });

    render(
      <IssueList
        issues={mockIssues}
        selectedId={1}
        searchQuery=""
        onSearchChange={vi.fn()}
        onSelect={vi.fn()}
        selectedIndex={0}
      />,
    );

    expect(document.getElementById).toHaveBeenCalledWith('issue-0');
    expect(scrollMock).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });

    document.getElementById = originalGetElementById;
  });
});
