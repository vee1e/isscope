import React from 'react';

interface TerminalProps {
    title?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export function Terminal({ title = 'Terminal', children, style }: TerminalProps) {
    return (
        <div
            style={{
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
                fontFamily: 'var(--font-mono)',
                ...style,
            }}
        >

            {/* Content */}
            <div style={{ padding: '16px' }}>{children}</div>
        </div>
    );
}
