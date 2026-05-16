import { Inbox } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function NoIssuesScreen() {
  const { setScreen } = useAppStore();

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
      }}
    >
      <Inbox size={44} style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          This repo has no open, unlinked issues.
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          All issues may already be linked to a PR, or none are open yet.
        </span>
      </div>
      <button
        onClick={() => setScreen('input')}
        style={{
          marginTop: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          padding: '6px 14px',
          cursor: 'pointer',
        }}
      >
        ← Try another repository
      </button>
    </div>
  );
}
