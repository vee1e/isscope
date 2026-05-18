import { render, screen, fireEvent } from '@testing-library/react';
import { SplitPane } from './SplitPane';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('SplitPane component', () => {
  it('renders left and right panes', () => {
    render(<SplitPane left={<div>Left Pane</div>} right={<div>Right Pane</div>} />);
    expect(screen.getByText('Left Pane')).toBeInTheDocument();
    expect(screen.getByText('Right Pane')).toBeInTheDocument();
  });

  it('handles mouse events for dragging', () => {
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      return {
        width: 1000,
        left: 0,
        top: 0,
        right: 1000,
        bottom: 500,
        x: 0,
        y: 0,
        height: 500,
        toJSON: () => {},
      };
    };

    render(
      <SplitPane left={<div>Left Pane</div>} right={<div>Right Pane</div>} defaultSplit={40} />,
    );

    const leftPane = screen.getByText('Left Pane').parentElement;
    const divider = screen.getByTestId('split-pane-divider');

    expect(divider).toBeInTheDocument();
    expect(leftPane).toHaveStyle({ width: '40%' });

    fireEvent.mouseDown(divider);
    fireEvent.mouseMove(window, { clientX: 600 });
    fireEvent.mouseUp(window);

    expect(leftPane).toHaveStyle({ width: '60%' });

    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });
});
