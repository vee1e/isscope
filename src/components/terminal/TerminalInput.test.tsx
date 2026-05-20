import { render, screen, fireEvent } from '@testing-library/react';
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

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(<TerminalInput value="" onChange={onChange} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
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
  });
});
