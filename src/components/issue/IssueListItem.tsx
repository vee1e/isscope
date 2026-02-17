import React from 'react';
import type { RankedIssue } from '../../lib/types';
import { getScoreClass } from '../../lib/types';
import { truncate, formatTimeAgo } from '../../lib/utils/formatters';

interface IssueListItemProps {
    issue: RankedIssue;
    rank: number;
    isSelected: boolean;
    onClick: () => void;
    id?: string;
}

export function IssueListItem({ issue, rank, isSelected, onClick, id }: IssueListItemProps) {
    const statusTag = issue.analysis
        ? issue.analysis.status === 'discussion'
            ? '[DISCUSSION] '
            : issue.analysis.status === 'external'
                ? '[EXTERNAL] '
                : issue.analysis.status === 'stale'
                    ? '[STALE] '
                    : issue.analysis.status === 'wontfix'
                        ? '[WONTFIX] '
                        : ''
        : '';

    return (
        <div
            id={id}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-subtle)',
                background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                borderLeft: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.1s ease',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
            }}
        >
            {/* Rank */}
            <span
                style={{
                    color: 'var(--text-dim)',
                    width: '24px',
                    textAlign: 'right',
                    flexShrink: 0,
                    fontSize: 'var(--text-xs)',
                }}
            >
                {rank}.
            </span>

            {/* Selector indicator */}
            <span style={{ color: isSelected ? 'var(--text)' : 'transparent', userSelect: 'none', flexShrink: 0 }}>
                ▶
            </span>

            {/* Issue number */}
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>#{issue.number}</span>

            {/* Title */}
            <span
                style={{
                    flex: 1,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {statusTag && <span style={{ color: 'var(--text-dim)' }}>{statusTag}</span>}
                {truncate(issue.title, 50)}
            </span>

            {/* Time ago */}
            <span
                style={{
                    color: 'var(--text-dim)',
                    flexShrink: 0,
                    fontSize: '11px',
                }}
            >
                {formatTimeAgo(issue.updated_at)}
            </span>

            {/* Score badge */}
            <span
                className={getScoreClass(issue.score)}
                style={{
                    fontWeight: 600,
                    width: '32px',
                    textAlign: 'right',
                    flexShrink: 0,
                }}
            >
                [{issue.score}]
            </span>
        </div>
    );
}
