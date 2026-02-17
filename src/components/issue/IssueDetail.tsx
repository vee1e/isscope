import React from 'react';
import { ScrollArea } from '../ui/ScrollArea';
import { IssueMetadata } from './IssueMetadata';
import { ExternalLink, MessageSquare, Calendar, User } from 'lucide-react';
import type { RankedIssue } from '../../lib/types';
import { formatTimestamp, formatTimeAgo } from '../../lib/utils/formatters';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface IssueDetailProps {
    issue: RankedIssue | null;
}

export function IssueDetail({ issue }: IssueDetailProps) {
    if (!issue) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--bg-tertiary)',
                    }}
                >
                    [ Issue Detail ]
                </div>
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-sm)',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-2xl)', marginBottom: '8px', opacity: 0.3 }}>{'{ }'}</div>
                        <div>Select an issue to view details</div>
                        <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>Use ↑/↓ or click to navigate</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <span>[ Issue Detail ]</span>
                <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}
                >
                    <ExternalLink size={11} />
                    Open on GitHub
                </a>
            </div>

            <ScrollArea style={{ flex: 1 }}>
                <div style={{ padding: '16px', fontFamily: 'var(--font-mono)' }}>
                    {/* Title */}
                    <h2
                        style={{
                            fontSize: 'var(--text-lg)',
                            fontWeight: 600,
                            color: 'var(--text)',
                            margin: 0,
                            lineHeight: 1.4,
                        }}
                    >
                        #{issue.number} — {issue.title}
                    </h2>

                    {/* Meta row */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '14px',
                            marginTop: '10px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-muted)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={11} /> {issue.user.login}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={11} /> {formatTimestamp(issue.created_at)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MessageSquare size={11} /> {issue.comments_count} comments
                        </span>
                        <span>Updated {formatTimeAgo(issue.updated_at)}</span>
                    </div>

                    {/* Labels */}
                    {issue.labels.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {issue.labels.map((label) => (
                                <span
                                    key={label.name}
                                    style={{
                                        padding: '1px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        border: `1px solid #${label.color}33`,
                                        color: `#${label.color}`,
                                        background: `#${label.color}11`,
                                    }}
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Analysis metadata */}
                    {issue.analysis && (
                        <div style={{ marginTop: '16px' }}>
                            <div
                                style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-dim)',
                                    marginBottom: '8px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    paddingBottom: '4px',
                                }}
                            >
                                ── AI Analysis ──
                            </div>
                            <IssueMetadata analysis={issue.analysis} />

                            {/* Summary */}
                            <div style={{ marginTop: '14px' }}>
                                <div
                                    style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--text-dim)',
                                        marginBottom: '6px',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        paddingBottom: '4px',
                                    }}
                                >
                                    ── Summary ──
                                </div>
                                <p
                                    style={{
                                        fontSize: 'var(--text-sm)',
                                        color: 'var(--text)',
                                        lineHeight: 1.6,
                                        margin: 0,
                                    }}
                                >
                                    {issue.analysis.summary}
                                </p>
                            </div>

                            {/* Notes */}
                            {issue.analysis.analysis_notes && (
                                <div style={{ marginTop: '12px' }}>
                                    <div
                                        style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--text-dim)',
                                            marginBottom: '6px',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            paddingBottom: '4px',
                                        }}
                                    >
                                        ── Analysis Notes ──
                                    </div>
                                    <p
                                        style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--text-muted)',
                                            lineHeight: 1.6,
                                            margin: 0,
                                        }}
                                    >
                                        {issue.analysis.analysis_notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comments */}
                    {issue.comments && issue.comments.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <div
                                style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-dim)',
                                    marginBottom: '8px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    paddingBottom: '4px',
                                }}
                            >
                                ── Comments ({issue.comments.length}) ──
                            </div>
                            {issue.comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    style={{
                                        padding: '12px 0',
                                        borderBottom: '1px solid var(--border-subtle)',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: 'var(--text-xs)',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                            @{comment.user.login}
                                        </span>
                                        <span style={{ color: 'var(--text-dim)' }}>
                                            {formatTimeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--text-muted)',
                                            lineHeight: 1.6,
                                            overflow: 'hidden',
                                        }}
                                        className="markdown-body"
                                    >
                                        <ReactMarkdown
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                img: ({ node, ...props }) => <img {...props} style={{ maxWidth: '100%', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />,
                                                a: ({ node, ...props }) => <a {...props} style={{ color: 'var(--text)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" />,
                                                p: ({ node, ...props }) => <p {...props} style={{ marginTop: '0.5em', marginBottom: '0.5em' }} />,
                                                pre: ({ node, ...props }) => <pre {...props} style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px', overflowX: 'auto' }} />,
                                                code: ({ node, ...props }) => <code {...props} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />,
                                            }}
                                        >
                                            {comment.body}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Body */}
                    {issue.body && (
                        <div style={{ marginTop: '16px' }}>
                            <div
                                style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-dim)',
                                    marginBottom: '8px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    paddingBottom: '4px',
                                }}
                            >
                                ── Issue Body ──
                            </div>
                            <div
                                style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.7,
                                }}
                                className="markdown-body"
                            >
                                <ReactMarkdown
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        img: ({ node, ...props }) => <img {...props} style={{ maxWidth: '100%', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />,
                                        a: ({ node, ...props }) => <a {...props} style={{ color: 'var(--text)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" />,
                                        p: ({ node, ...props }) => <p {...props} style={{ marginTop: '0.5em', marginBottom: '0.5em' }} />,
                                        pre: ({ node, ...props }) => <pre {...props} style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px', overflowX: 'auto' }} />,
                                        code: ({ node, ...props }) => <code {...props} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />,
                                    }}
                                >
                                    {issue.body}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
