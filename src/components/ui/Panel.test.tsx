import { render, screen } from '@testing-library/react';
import { Panel } from './Panel';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('Panel component', () => {
  it('renders children correctly', () => {
    render(<Panel>Panel Content</Panel>);
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Panel title="Test Title">Content</Panel>);
    expect(screen.getByText('[ Test Title ]')).toBeInTheDocument();
  });

  it('renders headerRight when provided', () => {
    render(
      <Panel title="Title" headerRight={<button>Action</button>}>
        Content
      </Panel>,
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
