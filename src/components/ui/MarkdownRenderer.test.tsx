import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('MarkdownRenderer component', () => {
  it('renders markdown content correctly', () => {
    render(<MarkdownRenderer content="# Hello World" />);
    // Testing specific output depends on react-markdown, we just test if the component renders the text
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders code blocks correctly', () => {
    render(<MarkdownRenderer content="`inline code`" />);
    expect(screen.getByText('inline code')).toBeInTheDocument();
    expect(screen.getByText('inline code').tagName).toBe('CODE');
  });

  it('renders links correctly', () => {
    render(<MarkdownRenderer content="[GitHub](https://github.com)" />);
    const link = screen.getByRole('link', { name: 'GitHub' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com');
  });
});
