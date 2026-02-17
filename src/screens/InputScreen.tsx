import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { useAppStore } from '../store/appStore';
import { validateRepoInput, parseRepoInput } from '../lib/utils/validators';
import { Zap, Github, ArrowRight, Settings, Key } from 'lucide-react';

export function InputScreen() {
    const { repoInput, setRepoInput, isValidRepo, githubToken, openRouterKey, setApiKeys } = useAppStore();
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setRepoInput(value);
        if (error) {
            const validation = validateRepoInput(value);
            if (validation.valid) setError(null);
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const validation = validateRepoInput(repoInput);
        if (!validation.valid) {
            setError(validation.error || 'Invalid repository');
            return;
        }

        // Sanitize input to owner/repo format if it's a URL
        const { owner, repo } = parseRepoInput(repoInput); // We know it's valid, but parse it to be safe
        const cleanRepo = `${owner}/${repo}`;
        if (cleanRepo !== repoInput) {
            setRepoInput(cleanRepo);
        }

        setError(null);
        setSubmitted(true);
        useAppStore.getState().setScreen('fetching');
    };

    return (
        <ScreenLayout centered>
            {/* Grid Background */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    backgroundImage: `
                        linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                    opacity: 0.4,
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '600px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '32px',
                }}
            >
                {/* Hero Section */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border)',
                            marginBottom: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }}
                    >
                        <Github size={32} style={{ color: 'var(--text)' }} />
                    </div>

                    <h1
                        style={{
                            fontSize: '42px',
                            fontWeight: 700,
                            letterSpacing: '-0.04em',
                            lineHeight: 1.1,
                            color: 'var(--text)',
                            margin: 0,
                        }}
                    >
                        Triage issues <span style={{ color: 'var(--text-muted)' }}>fast.</span>
                    </h1>

                    <p
                        style={{
                            fontSize: '18px',
                            color: 'var(--text-dim)',
                            maxWidth: '480px',
                            lineHeight: 1.5,
                            margin: 0,
                        }}
                    >
                        Isscope uses AI to analyze, rank, and summarize GitHub issues by their implementability.
                    </p>
                </div>

                {/* Input Section */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        width: '100%',
                        maxWidth: '480px',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={repoInput}
                            onChange={handleChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="owner/repo [Cmd+K]"
                            disabled={submitted}
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                fontSize: '16px',
                                background: 'var(--bg-secondary)',
                                border: `1px solid ${error ? 'var(--status-error)' : isFocused ? 'var(--text-muted)' : 'var(--border)'}`,
                                borderRadius: '12px',
                                color: 'var(--text)',
                                outline: 'none',
                                fontFamily: 'var(--font-mono)',
                                transition: 'all 0.2s ease',
                                boxShadow: isFocused ? '0 0 0 4px var(--bg-tertiary)' : 'none',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-dim)',
                                pointerEvents: 'none'
                            }}
                        >
                            <Github size={18} />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            color: 'var(--status-error)',
                            fontSize: '13px',
                            paddingLeft: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span>✗</span> {error}
                        </div>
                    )}

                    <Button
                        size="lg"
                        disabled={!isValidRepo || submitted}
                        loading={submitted}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '15px',
                            fontWeight: 600,
                            background: isValidRepo && !submitted ? 'var(--text)' : 'var(--bg-tertiary)',
                            color: isValidRepo && !submitted ? 'var(--bg)' : 'var(--text-dim)',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: isValidRepo && !submitted ? 'pointer' : 'not-allowed',
                            opacity: submitted ? 0.7 : 1,
                        }}
                    >
                        {submitted ? 'Analyzing Repository...' : 'Start Analysis'}
                        {!submitted && <ArrowRight size={16} />}
                    </Button>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setShowConfig(!showConfig)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-dim)',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                margin: '0 auto',
                                padding: '8px',
                                borderRadius: '6px',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <Settings size={14} />
                            {showConfig ? 'Hide API Configuration' : 'Configure API Keys'}
                        </button>

                        {showConfig && (
                            <div
                                style={{
                                    marginTop: '16px',
                                    padding: '20px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    textAlign: 'left',
                                    animation: 'fadeIn 0.2s ease',
                                }}
                            >
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        GitHub Token (optional, for higher rate limits)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="password"
                                            value={githubToken}
                                            onChange={(e) => setApiKeys({ githubToken: e.target.value })}
                                            placeholder="ghp_..."
                                            style={{
                                                width: '100%',
                                                padding: '10px 10px 10px 36px',
                                                fontSize: '13px',
                                                background: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: '8px',
                                                color: 'var(--text)',
                                                fontFamily: 'var(--font-mono)',
                                                outline: 'none',
                                            }}
                                        />
                                        <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                        OpenRouter API Key (required for analysis)
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="password"
                                            value={openRouterKey}
                                            onChange={(e) => setApiKeys({ openRouterKey: e.target.value })}
                                            placeholder="sk-or-..."
                                            style={{
                                                width: '100%',
                                                padding: '10px 10px 10px 36px',
                                                fontSize: '13px',
                                                background: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: '8px',
                                                color: 'var(--text)',
                                                fontFamily: 'var(--font-mono)',
                                                outline: 'none',
                                            }}
                                        />
                                        <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <span style={{
                            fontSize: '12px',
                            color: 'var(--text-dim)',
                            background: 'var(--bg-secondary)',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            built by <a href="https://github.com/vee1e" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '4px', transition: 'color 0.2s' }}>Lakshit Verma</a>
                        </span>
                    </div>
                </form>
            </div>
        </ScreenLayout>
    );
}
