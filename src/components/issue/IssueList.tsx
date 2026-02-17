import React, { useMemo } from 'react';
import { ScrollArea } from '../ui/ScrollArea';
import { IssueListItem } from './IssueListItem';
import { Search } from 'lucide-react';
import type { RankedIssue } from '../../lib/types';

interface IssueListProps {
    issues: RankedIssue[];
    selectedId: number | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelect: (id: number) => void;
    selectedIndex: number;
}

export function IssueList({
    issues,
    selectedId,
    searchQuery,
    onSearchChange,
    onSelect,
    selectedIndex,
}: IssueListProps) {
    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return issues;
        const q = searchQuery.toLowerCase();
        return issues.filter(
            (issue) =>
                issue.title.toLowerCase().includes(q) ||
                issue.labels.some((l) => l.name.toLowerCase().includes(q)) ||
                (issue.body && issue.body.toLowerCase().includes(q)) ||
                `#${issue.number}`.includes(q)
        );
    }, [issues, searchQuery]);

    const inputRef = React.useRef<HTMLInputElement>(null);
    const trapRef = React.useRef<HTMLInputElement>(null);

    // Focus trap on mount
    React.useEffect(() => {
        // Short timeout to ensure render
        const timer = setTimeout(() => {
            trapRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKv = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKv);
        return () => window.removeEventListener('keydown', handleKv);
    }, []);

    // Search input key handler (Esc to blur)
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            inputRef.current?.blur();
            trapRef.current?.focus();
        }
    };

    // Auto-scroll to selected item
    React.useEffect(() => {
        // ... (existing scroll logic)
        if (selectedIndex >= 0 && filtered.length > 0) {
            const el = document.getElementById(`issue-${selectedIndex}`);
            if (el) {
                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex, filtered]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderRight: '1px solid var(--border)',
            }}
            onClick={() => {
                // If clicking empty space, refocus trap unless we clicked an interactive element
                if (document.activeElement === document.body) {
                    trapRef.current?.focus();
                }
            }}
        >
            {/* Nav Trap Input (Invisible) */}
            <input
                ref={trapRef}
                data-nav-trap="true"
                style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    height: 0,
                    width: 0,
                }}
                onBlur={() => {
                    // Optional: force keep focus? No, user might want to click outside.
                }}
            />

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
                <span>╭─ Issues (ranked by doability) ─╮</span>
                <span style={{ color: 'var(--text-dim)' }}>{filtered.length} items</span>
            </div>

            {/* Search */}
            <div
                style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}
            >
                <Search size={12} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search issues... [Cmd+K]"
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text)',
                        width: '100%',
                        padding: '4px 0',
                    }}
                />
            </div>

            {/* Issue list */}
            <ScrollArea style={{ flex: 1 }}>
                {filtered.length === 0 ? (
                    <div
                        style={{
                            padding: '20px 12px',
                            textAlign: 'center',
                            color: 'var(--text-dim)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-mono)',
                        }}
                    >
                        {searchQuery ? 'No issues match your search.' : 'No issues found.'}
                    </div>
                ) : (
                    filtered.map((issue, index) => (
                        <IssueListItem
                            key={issue.number}
                            id={`issue-${index}`}
                            issue={issue}
                            rank={index + 1}
                            isSelected={issue.number === selectedId}
                            onClick={() => onSelect(issue.number)}
                        />
                    ))
                )}
            </ScrollArea>

            {/* Footer */}
            <div
                style={{
                    padding: '6px 12px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg-tertiary)',
                }}
            >
                [j/k] Nav  [Enter] Sel  [Cmd+K] Search
            </div>
        </div>
    );
}
