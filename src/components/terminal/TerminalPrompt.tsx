import React from 'react';

interface TerminalPromptProps {
    prefix?: string;
    children?: React.ReactNode;
}

export function TerminalPrompt({ prefix = '>', children }: TerminalPromptProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-base)',
            }}
        >
            <span
                style={{
                    color: 'var(--primary)',
                    fontWeight: 600,
                    userSelect: 'none',
                }}
            >
                {prefix}
            </span>
            <div style={{ flex: 1, color: 'var(--text)' }}>{children}</div>
        </div>
    );
}
