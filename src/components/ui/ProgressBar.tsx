import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    showCount?: boolean;
    style?: React.CSSProperties;
}

export function ProgressBar({ current, total, label, showCount = true, style }: ProgressBarProps) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    // ASCII-style progress bar
    const barWidth = 30;
    const filled = Math.round((percent / 100) * barWidth);
    const empty = barWidth - filled;
    const asciiBar = '█'.repeat(filled) + '░'.repeat(empty);

    return (
        <div
            style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                ...style,
            }}
        >
            {label && (
                <div
                    style={{
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        fontSize: 'var(--text-xs)',
                    }}
                >
                    {label}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: percent === 100 ? 'var(--status-success)' : 'var(--text)' }}>
                    {asciiBar}
                </span>
                {showCount && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                        {current}/{total} ({percent}%)
                    </span>
                )}
            </div>
        </div>
    );
}
