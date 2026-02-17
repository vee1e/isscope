import React from 'react';
import { ScrollArea } from '../ui/ScrollArea';
import type { LogEntry } from '../../lib/types';

interface TerminalLogProps {
    entries: LogEntry[];
    maxHeight?: string;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
}

const typeColors: Record<string, string> = {
    info: 'var(--text-muted)',
    success: 'var(--status-success)',
    warning: 'var(--status-warning)',
    error: 'var(--status-error)',
};

const typePrefix: Record<string, string> = {
    info: '│',
    success: '│',
    warning: '│',
    error: '│',
};

export function TerminalLog({ entries, maxHeight = '300px', scrollRef }: TerminalLogProps) {
    return (
        <div
            style={{
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg)',
                overflow: 'hidden',
                fontFamily: 'var(--font-mono)',
            }}
        >
            <div
                style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-dim)',
                    background: 'var(--bg-tertiary)',
                }}
            >
                ┌─ Activity Log ─────────────────────────────────────┐
            </div>
            <ScrollArea maxHeight={maxHeight} innerRef={scrollRef}>
                <div style={{ padding: '8px 12px' }}>
                    {entries.length === 0 && (
                        <div
                            style={{
                                color: 'var(--text-dim)',
                                fontSize: 'var(--text-xs)',
                                padding: '8px 0',
                            }}
                        >
                            Waiting for activity...
                        </div>
                    )}
                    {entries.map((entry, i) => (
                        <div
                            key={i}
                            className="animate-fade-in"
                            style={{
                                display: 'flex',
                                gap: '8px',
                                fontSize: 'var(--text-xs)',
                                lineHeight: '1.8',
                                alignItems: 'flex-start',
                            }}
                        >
                            <span style={{ color: 'var(--text-dim)', flexShrink: 0, userSelect: 'none' }}>
                                [{entry.timestamp}]
                            </span>
                            <span style={{ color: typeColors[entry.type] || 'var(--text-muted)', userSelect: 'none', flexShrink: 0 }}>
                                {typePrefix[entry.type] || '│'}
                            </span>
                            <span style={{ color: typeColors[entry.type] || 'var(--text)', wordBreak: 'break-word' }}>
                                {entry.message}
                            </span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div
                style={{
                    padding: '4px 12px',
                    borderTop: '1px solid var(--border)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-dim)',
                    background: 'var(--bg-tertiary)',
                }}
            >
                └─────────────────────────────────────────────────────┘
            </div>
        </div>
    );
}
