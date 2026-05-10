import type { CSSProperties } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: CSSProperties;
}

function withoutNode<T extends { node?: unknown }>(props: T) {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

const markdownComponents: Components = {
  img: ({ ...props }) => (
    <img
      {...withoutNode(props)}
      style={{
        maxWidth: '100%',
        borderRadius: '4px',
        border: '1px solid var(--border-subtle)',
      }}
    />
  ),
  a: ({ ...props }) => (
    <a
      {...withoutNode(props)}
      style={{ color: 'var(--text)', textDecoration: 'underline' }}
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  p: ({ ...props }) => (
    <p {...withoutNode(props)} style={{ marginTop: '0.5em', marginBottom: '0.5em' }} />
  ),
  pre: ({ ...props }) => (
    <pre
      {...withoutNode(props)}
      style={{
        background: 'var(--bg-secondary)',
        padding: '8px',
        borderRadius: '4px',
        overflowX: 'auto',
      }}
    />
  ),
  code: ({ ...props }) => (
    <code {...withoutNode(props)} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />
  ),
};

export function MarkdownRenderer({ content, className, style }: MarkdownRendererProps) {
  return (
    <div className={className} style={style}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
