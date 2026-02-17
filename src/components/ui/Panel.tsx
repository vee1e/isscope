import React from 'react';

interface PanelProps {
    title?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    headerRight?: React.ReactNode;
}

export function Panel({ title, children, style, className, headerRight }: PanelProps) {
    return (
        <div
            className={className}
            style={{
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
                ...style,
            }}
        >
            {title && (
                <div
                    style={{
                        padding: '8px 14px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-tertiary)',
                    }}
                >
                    <span>╭─ {title} ─╮</span>
                    {headerRight}
                </div>
            )}
            <div style={{ padding: '12px 14px' }}>{children}</div>
        </div>
    );
}
