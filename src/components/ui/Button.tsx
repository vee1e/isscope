import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    style,
    ...props
}: ButtonProps) {
    const baseStyle: React.CSSProperties = {
        fontFamily: 'var(--font-mono)',
        fontSize: size === 'sm' ? 'var(--text-xs)' : size === 'lg' ? 'var(--text-lg)' : 'var(--text-sm)',
        padding: size === 'sm' ? '4px 10px' : size === 'lg' ? '10px 24px' : '7px 16px',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        letterSpacing: '-0.01em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        opacity: disabled || loading ? 0.5 : 1,
        ...getVariantStyle(variant),
        ...style,
    };

    return (
        <button style={baseStyle} disabled={disabled || loading} {...props}>
            {loading && <span className="animate-pulse-slow">⏳</span>}
            {children}
        </button>
    );
}

function getVariantStyle(variant: string): React.CSSProperties {
    switch (variant) {
        case 'primary':
            return {
                background: 'var(--bg-tertiary)',
                color: 'var(--text)',
                borderColor: 'var(--border)',
            };
        case 'ghost':
            return {
                background: 'transparent',
                color: 'var(--text-muted)',
                borderColor: 'transparent',
            };
        case 'danger':
            return {
                background: 'rgba(248, 81, 73, 0.1)',
                color: 'var(--status-error)',
                borderColor: 'rgba(248, 81, 73, 0.2)',
            };
        default:
            return {};
    }
}
