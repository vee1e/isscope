import { render, screen } from '@testing-library/react';
import { TerminalPrompt } from './TerminalPrompt';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('TerminalPrompt component', () => {
  it('renders default prefix and children', () => {
    render(<TerminalPrompt>Prompt Content</TerminalPrompt>);
    expect(screen.getByText('>')).toBeInTheDocument();
    expect(screen.getByText('Prompt Content')).toBeInTheDocument();
  });

  it('renders custom prefix', () => {
    render(<TerminalPrompt prefix="$">Prompt Content</TerminalPrompt>);
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.queryByText('>')).not.toBeInTheDocument();
  });
});
