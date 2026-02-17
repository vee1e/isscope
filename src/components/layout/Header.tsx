import React from 'react';
import { Monitor } from 'lucide-react';

interface HeaderProps {
    rightContent?: React.ReactNode;
}

export function Header({ rightContent }: HeaderProps) {


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
                {rightContent}
            </div>
        </header>
    );
}
