import React, { useMemo } from 'react';
import { ScrollArea } from '../ui/ScrollArea';
import { IssueListItem } from './IssueListItem';
import { Search } from 'lucide-react';
import type { RankedIssue } from '../../lib/types';
import { modifierLabel, modifierKey } from '../../lib/utils/platform';

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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const trapRef = React.useRef<HTMLDivElement>(null);
  const filtered = useMemo(
    () =>
      searchQuery
        ? issues.filter((i) =>
            i.title.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : issues,
    [issues, searchQuery],
  );

  // Auto-blur search on mount
  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.blur(), 0);
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
      if (e.key === 'j' && filtered.length > 0) {
        e.preventDefault();
        const idx = selectedIndex < filtered.length - 1 ? selectedIndex + 1 : 0;
        onSelect(filtered[idx].number);
      }
      if (e.key === 'k' && filtered.length > 0) {
        e.preventDefault();
        const idx = selectedIndex > 0 ? selectedIndex - 1 : filtered.length - 1;
        onSelect(filtered[idx].number);
      }
    };
    window.addEventListener('keydown', handleKv);
    return () => window.removeEventListener('keydown', handleKv);
  }, [filtered, selectedIndex, onSelect]);

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
        <span>[ Issues (ranked by doability) ]</span>
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
          placeholder={`Search issues... [${modifierLabel()}+K]`}
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
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            {searchQuery ? 'No issues match your search.' : 'No issues found.'}
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
              {searchQuery
                ? 'Try a different keyword or clear the search.'
                : 'This repo may have no open issues or they were all filtered.'}
            </div>
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
        [j/k] Nav [Enter] Sel [{modifierKey()}+K] Search
      </div>
    </div>
  );
}
