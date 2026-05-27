import React from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  rightContent?: React.ReactNode;
}

export function Header({ rightContent }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Monitor size={18} style={{ color: 'var(--primary)' }} />
        <span
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
          }}
        >
          Isscope
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
            border: '1px solid var(--border-subtle)',
            padding: '1px 6px',
            borderRadius: '4px',
          }}
        >
          v1.0.0
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            background: 'none',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            borderRadius: '4px',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {rightContent}
      </div>
    </header>
  );
}
