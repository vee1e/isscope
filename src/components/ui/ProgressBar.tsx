import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    showCount?: boolean;
    style?: React.CSSProperties;
    startTime?: number;
}

export function ProgressBar({ current, total, label, showCount = true, style, startTime }: ProgressBarProps) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    const [elapsed, setElapsed] = useState(0);

    // Update elapsed time every second
    useEffect(() => {
        if (!startTime) return;
        
        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [startTime]);

    // Calculate time remaining
    const getTimeRemaining = (): string => {
        if (!startTime || current === 0) return 'calculating...';
        if (current >= total) return 'done';
        
        const elapsedMs = Date.now() - startTime;
        const rate = current / elapsedMs; // items per ms
        const remaining = total - current;
        const remainingMs = remaining / rate;
        
        if (remainingMs < 1000) return '< 1s';
        if (remainingMs < 60000) return `${Math.ceil(remainingMs / 1000)}s`;
        const minutes = Math.ceil(remainingMs / 60000);
        return `${minutes}m`;
    };

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
            {startTime && (
                <div
                    style={{
                        color: 'var(--text-dim)',
                        fontSize: 'var(--text-xs)',
                        marginTop: '4px',
                        display: 'flex',
                        gap: '16px',
                    }}
                >
                    <span>ETA: {getTimeRemaining()}</span>
                    {elapsed > 0 && (
                        <span>Elapsed: {formatDuration(elapsed)}</span>
                    )}
                </div>
            )}
        </div>
    );
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}
