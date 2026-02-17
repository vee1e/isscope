import React, { useRef, useEffect } from 'react';

interface TerminalInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    disabled?: boolean;
    hasError?: boolean;
}

export function TerminalInput({
    value,
    onChange,
    onSubmit,
    placeholder = 'Type here...',
    disabled = false,
    hasError = false,
}: TerminalInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !disabled) {
            onSubmit();
        }
        if (e.key === 'Escape') {
            onChange('');
            inputRef.current?.focus();
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
            }}
        >
            <span
                style={{
                    color: hasError ? 'var(--status-error)' : 'var(--primary)',
                    fontWeight: 600,
                    fontSize: 'var(--text-lg)',
                    userSelect: 'none',
                }}
            >
                &gt;
            </span>
            <div style={{ flex: 1, position: 'relative' }}>
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-base)',
                        padding: '8px 0',
                        background: 'transparent',
                        color: 'var(--text)',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        caretColor: 'var(--cursor)',
                        letterSpacing: '-0.01em',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: hasError
                            ? 'var(--status-error)'
                            : 'var(--border)',
                        transition: 'background 0.15s ease',
                    }}
                />
            </div>
            {/* Blinking cursor indicator */}
            {!value && (
                <span
                    className="animate-blink"
                    style={{
                        color: 'var(--cursor)',
                        fontSize: 'var(--text-lg)',
                        userSelect: 'none',
                    }}
                >
                    █
                </span>
            )}
        </div>
    );
}
