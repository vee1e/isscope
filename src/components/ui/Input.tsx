import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ hasError, style, ...props }, ref) => {
        const inputStyle: React.CSSProperties = {
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-base)',
            padding: '10px 14px',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: `1px solid ${hasError ? 'var(--status-error)' : 'var(--border)'}`,
            borderRadius: '6px',
            outline: 'none',
            width: '100%',
            transition: 'border-color 0.15s ease',
            letterSpacing: '-0.01em',
            lineHeight: '1.6',
            caretColor: 'var(--cursor)',
            ...style,
        };

        return <input ref={ref} style={inputStyle} {...props} />;
    }
);

Input.displayName = 'Input';
