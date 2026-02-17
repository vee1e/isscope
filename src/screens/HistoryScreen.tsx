import React, { useEffect, useState } from 'react';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { useAppStore } from '../store/appStore';
import { ArrowLeft, Clock, Trash2, ExternalLink, RefreshCw, Activity, MessageSquare, GitBranch, Search } from 'lucide-react';
import type { HistoryMetadata } from '../lib/types';

function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatActivityRate(rate: number): string {
    if (rate < 0.1) return 'Low';
    if (rate < 1) return 'Moderate';
    if (rate < 5) return 'High';
    return 'Very High';
}

function getActivityColor(rate: number): string {
    if (rate < 0.1) return 'var(--text-dim)';
    if (rate < 1) return 'var(--status-success)';
    if (rate < 5) return 'var(--status-warning)';
    return 'var(--status-error)';
}

export function HistoryScreen() {
    const { history, isHistoryLoading, loadHistory, deleteFromHistory, clearAllHistory, setRepoInput, setScreen } = useAppStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const filteredHistory = history.filter(entry => 
        entry.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLoadRepo = (key: string) => {
        setRepoInput(key);
        setScreen('fetching');
    };

    const handleDelete = async (key: string) => {
        const [owner, repo] = key.split('/');
        await deleteFromHistory(owner, repo);
        if (selectedEntry === key) {
            setSelectedEntry(null);
        }
    };

    const selectedData = selectedEntry ? history.find(h => h.key === selectedEntry) : null;

    return (
        <ScreenLayout>
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                padding: '20px',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                gap: '16px',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setScreen('input')}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 600,
                            color: 'var(--text)',
                            margin: 0,
                        }}>
                            History
                        </h1>
                        <span style={{
                            fontSize: '13px',
                            color: 'var(--text-dim)',
                            background: 'var(--bg-secondary)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                        }}>
                            {history.length} repositories
                        </span>
                    </div>
                    
                    {history.length > 0 && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={async () => {
                                if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                                    await clearAllHistory();
                                    setSelectedEntry(null);
                                }
                            }}
                        >
                            <Trash2 size={14} />
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search repositories..."
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            fontSize: '14px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text)',
                            outline: 'none',
                            fontFamily: 'var(--font-mono)',
                        }}
                    />
                    <Search size={16} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                    }} />
                </div>

                {/* Content */}
                {isHistoryLoading ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dim)',
                    }}>
                        Loading history...
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dim)',
                        gap: '16px',
                    }}>
                        <div style={{ fontSize: '48px', opacity: 0.3 }}>📚</div>
                        <div>
                            {searchQuery ? 'No repositories match your search' : 'No history yet'}
                        </div>
                        {!searchQuery && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setScreen('input')}
                            >
                                Analyze Your First Repository
                            </Button>
                        )}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: selectedEntry ? '1fr 1fr' : '1fr',
                        gap: '16px',
                        flex: 1,
                        overflow: 'hidden',
                    }}>
                        {/* History List */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            overflow: 'auto',
                            paddingRight: '8px',
                        }}>
                            {filteredHistory.map((entry) => (
                                <div
                                    key={entry.key}
                                    onClick={() => setSelectedEntry(entry.key)}
                                    style={{
                                        padding: '16px',
                                        background: selectedEntry === entry.key ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                        border: `1px solid ${selectedEntry === entry.key ? 'var(--border)' : 'var(--border-subtle)'}`,
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '8px',
                                    }}>
                                        <span style={{
                                            fontSize: '15px',
                                            fontWeight: 500,
                                            color: 'var(--text)',
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            {entry.key}
                                        </span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLoadRepo(entry.key);
                                                }}
                                                style={{
                                                    padding: '6px',
                                                    background: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-subtle)',
                                                    borderRadius: '6px',
                                                    color: 'var(--text)',
                                                    cursor: 'pointer',
                                                }}
                                                title="Load repository"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(entry.key);
                                                }}
                                                style={{
                                                    padding: '6px',
                                                    background: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-subtle)',
                                                    borderRadius: '6px',
                                                    color: 'var(--status-error)',
                                                    cursor: 'pointer',
                                                }}
                                                title="Delete from history"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        fontSize: '12px',
                                        color: 'var(--text-dim)',
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {formatTimeAgo(entry.fetchedAt)}
                                        </span>
                                        <span>{entry.metadata.issueCount} issues</span>
                                        <span style={{
                                            color: getActivityColor(entry.metadata.issuesActivity.newIssuesPerDay),
                                        }}>
                                            {formatActivityRate(entry.metadata.issuesActivity.newIssuesPerDay)} activity
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Details Panel */}
                        {selectedData && (
                            <Panel title="Repository Details" style={{ overflow: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Header */}
                                    <div>
                                        <h2 style={{
                                            fontSize: '20px',
                                            fontWeight: 600,
                                            color: 'var(--text)',
                                            margin: '0 0 8px 0',
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            {selectedData.key}
                                        </h2>
                                        <div style={{
                                            fontSize: '13px',
                                            color: 'var(--text-dim)',
                                        }}>
                                            Last analyzed: {formatDate(selectedData.fetchedAt)}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                    }}>
                                        <StatCard
                                            icon={<GitBranch size={16} />}
                                            label="Total Issues"
                                            value={selectedData.metadata.issueCount.toString()}
                                        />
                                        <StatCard
                                            icon={<Activity size={16} />}
                                            label="Issue Rate"
                                            value={`${selectedData.metadata.issuesActivity.newIssuesPerDay.toFixed(1)}/day`}
                                            color={getActivityColor(selectedData.metadata.issuesActivity.newIssuesPerDay)}
                                        />
                                        <StatCard
                                            icon={<MessageSquare size={16} />}
                                            label="Comment Rate"
                                            value={`${selectedData.metadata.commentsActivity.newCommentsPerDay.toFixed(1)}/day`}
                                        />
                                        <StatCard
                                            icon={<Clock size={16} />}
                                            label="Activity Level"
                                            value={formatActivityRate(selectedData.metadata.issuesActivity.newIssuesPerDay)}
                                            color={getActivityColor(selectedData.metadata.issuesActivity.newIssuesPerDay)}
                                        />
                                    </div>

                                    {/* Activity Info */}
                                    <div style={{
                                        padding: '12px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        color: 'var(--text-dim)',
                                    }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong style={{ color: 'var(--text)' }}>Last Issue Created:</strong>
                                            <br />
                                            {new Date(selectedData.metadata.issuesActivity.lastIssueCreatedAt).toLocaleDateString()}
                                        </div>
                                        <div>
                                            <strong style={{ color: 'var(--text)' }}>Last Comment:</strong>
                                            <br />
                                            {new Date(selectedData.metadata.commentsActivity.lastCommentCreatedAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            size="sm"
                                            style={{ flex: 1 }}
                                            onClick={() => handleLoadRepo(selectedData.key)}
                                        >
                                            <RefreshCw size={14} />
                                            Load Repository
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const [owner, repo] = selectedData.key.split('/');
                                                window.open(`https://github.com/${owner}/${repo}`, '_blank');
                                            }}
                                        >
                                            <ExternalLink size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </Panel>
                        )}
                    </div>
                )}
            </div>
        </ScreenLayout>
    );
}

function StatCard({ icon, label, value, color }: { 
    icon: React.ReactNode; 
    label: string; 
    value: string;
    color?: string;
}) {
    return (
        <div style={{
            padding: '12px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-dim)',
            }}>
                {icon}
                {label}
            </div>
            <div style={{
                fontSize: '18px',
                fontWeight: 600,
                color: color || 'var(--text)',
            }}>
                {value}
            </div>
        </div>
    );
}
