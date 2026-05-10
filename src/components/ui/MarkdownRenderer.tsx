import type { CSSProperties } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: CSSProperties;
}

const rehypePlugins = [rehypeRaw, rehypeSanitize];

const markdownComponents: Components = {
  img: ({ node, ...props }) => {
    void node;

    return (
      <img
        {...props}
        style={{
          maxWidth: '100%',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
        }}
      />
    );
  },
  a: ({ node, ...props }) => {
    void node;

    return (
      <a
        {...props}
        style={{ color: 'var(--text)', textDecoration: 'underline' }}
        target="_blank"
        rel="noopener noreferrer"
      />
    );
  },
  p: ({ node, ...props }) => {
    void node;

    return <p {...props} style={{ marginTop: '0.5em', marginBottom: '0.5em' }} />;
  },
  pre: ({ node, ...props }) => {
    void node;

    return (
      <pre
        {...props}
        style={{
          background: 'var(--bg-secondary)',
          padding: '8px',
          borderRadius: '4px',
          overflowX: 'auto',
        }}
      />
    );
  },
  code: ({ node, ...props }) => {
    void node;

    return <code {...props} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />;
  },
};

export function MarkdownRenderer({ content, className, style }: MarkdownRendererProps) {
  return (
    <div className={className} style={style}>
      <ReactMarkdown rehypePlugins={rehypePlugins} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
