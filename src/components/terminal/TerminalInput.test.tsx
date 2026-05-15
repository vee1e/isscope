import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TerminalInput } from './TerminalInput';

describe('TerminalInput accessibility', () => {
  it('provides an explicit aria-label for the terminal input', () => {
    const markup = renderToStaticMarkup(
      <TerminalInput value="" onChange={() => {}} onSubmit={() => {}} />,
    );

    expect(markup).toContain('aria-label="Terminal input"');
  });

  it('sets aria-invalid when hasError is true', () => {
    const markup = renderToStaticMarkup(
      <TerminalInput value="" onChange={() => {}} onSubmit={() => {}} hasError />,
    );

    expect(markup).toContain('aria-invalid="true"');
  });
});
