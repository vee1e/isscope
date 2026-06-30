import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { GITHUB_TOKEN_SETTINGS_URL } from '../../lib/api/github';

/**
 * Persistent banner for token-scope errors. Unlike the terminal log, this
 * stays visible across screen transitions until the user dismisses it or
 * updates their token, since the fix requires leaving the current flow.
 */
export function PermissionErrorBanner() {
  const { permissionError, setPermissionError } = useAppStore();

  if (!permissionError) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        background: 'var(--status-error-bg, rgba(220, 38, 38, 0.12))',
        borderBottom: '1px solid var(--status-error)',
        color: 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
      }}
    >
      <ShieldAlert
        size={16}
        style={{ color: 'var(--status-error)', flexShrink: 0, marginTop: 1 }}
      />
      <div style={{ flex: 1, lineHeight: 1.5 }}>
        {permissionError}{' '}
        <a
          href={GITHUB_TOKEN_SETTINGS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--text)', textDecoration: 'underline' }}
        >
          Update token
        </a>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setPermissionError(null)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
