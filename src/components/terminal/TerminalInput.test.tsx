import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminalInput } from './TerminalInput';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('TerminalInput component', () => {
  it('renders correctly', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<TerminalInput value="" onChange={onChange} onSubmit={onSubmit} />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const Wrapper = () => {
      const [val, setVal] = React.useState('');
      return (
        <TerminalInput
          value={val}
          onChange={(v) => {
            setVal(v);
            onChange(v);
          }}
          onSubmit={vi.fn()}
        />
      );
    };
    render(<Wrapper />);
    const input = screen.getByPlaceholderText('Type here...');
    await user.type(input, 'hello');
    expect(onChange).toHaveBeenLastCalledWith('hello');
  });

  it('calls onSubmit when Enter is pressed', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<TerminalInput value="test" onChange={onChange} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSubmit).toHaveBeenCalled();
  });

  it('clears input when Escape is pressed', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<TerminalInput value="test" onChange={onChange} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(onChange).toHaveBeenCalledWith('');
    expect(input).toHaveFocus();
  });

  it('handles disabled state correctly', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<TerminalInput value="" onChange={onChange} onSubmit={onSubmit} disabled />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).toBeDisabled();

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('applies error styles when hasError is true', () => {
    render(<TerminalInput value="" onChange={vi.fn()} onSubmit={vi.fn()} hasError />);
    const prompt = screen.getByText('>');
    expect(prompt).toHaveStyle({ color: 'var(--status-error)' });
  });
});
