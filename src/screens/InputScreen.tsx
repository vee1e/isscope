import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/Button';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { useAppStore } from '../store/appStore';
import { validateRepoInput, parseRepoInput } from '../lib/utils/validators';
import {
  Github,
  Settings,
  Key,
  History,
  Clock,
  GitPullRequest,
  Save,
  Check,
  Loader2,
  Sun,
  Moon,
  Server,
} from 'lucide-react';
import { CONFIG } from '../lib/constants';
import { historyService } from '../lib/history/historyService';
import { formatTimeAgo } from '../lib/utils/formatters';
import type { AIProvider } from '../lib/types';

// Storage keys for localStorage
const STORAGE_KEY_GITHUB = 'isscope_github_token';
const STORAGE_KEY_OPENROUTER = 'isscope_openrouter_key';
const STORAGE_KEY_AI_PROVIDER = 'isscope_ai_provider';
const STORAGE_KEY_LOCAL_ENDPOINT = 'isscope_local_endpoint';
const STORAGE_KEY_LOCAL_MODEL = 'isscope_local_model';
const STORAGE_KEY_LOCAL_API_KEY = 'isscope_local_api_key';
const STORAGE_KEY_MAX_ISSUES = 'isscope_max_issues';
const STORAGE_KEY_REMEMBER_KEYS = 'isscope_remember_keys';

export function InputScreen() {
  const {
    repoInput,
    setRepoInput,
    isValidRepo,
    githubToken,
    openRouterKey,
    setApiKeys,
    history,
    isHistoryLoading,
    loadHistory,
    maxIssues,
    setMaxIssues,
    setIssues,
    setAnalyses,
    setScreen,
    addLog,
    aiProvider,
    setAiProvider,
    localEndpoint,
    localModel,
    localApiKey,
    setLocalConfig,
  } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false);

  // Local state for API key inputs
  const [localGithubToken, setLocalGithubToken] = useState(githubToken);
  const [localOpenRouterKey, setLocalOpenRouterKey] = useState(openRouterKey);
  const [localProvider, setLocalProvider] = useState<AIProvider>(aiProvider);
  const [localEndpointInput, setLocalEndpointInput] = useState(localEndpoint);
  const [localModelInput, setLocalModelInput] = useState(localModel);
  const [localApiKeyInput, setLocalApiKeyInput] = useState(localApiKey);
  const [localMaxIssues, setLocalMaxIssues] = useState(maxIssues);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [rememberKeys, setRememberKeys] = useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load API keys from localStorage on mount
  useEffect(() => {
    const shouldRemember = localStorage.getItem(STORAGE_KEY_REMEMBER_KEYS) === 'true';
    const storedGithub = shouldRemember ? localStorage.getItem(STORAGE_KEY_GITHUB) || '' : '';
    const storedOpenRouter = shouldRemember
      ? localStorage.getItem(STORAGE_KEY_OPENROUTER) || ''
      : '';
    const storedProvider = localStorage.getItem(STORAGE_KEY_AI_PROVIDER) as AIProvider | null;
    const storedEndpoint = localStorage.getItem(STORAGE_KEY_LOCAL_ENDPOINT);
    const storedModel = localStorage.getItem(STORAGE_KEY_LOCAL_MODEL);
    const storedLocalApiKey = shouldRemember
      ? localStorage.getItem(STORAGE_KEY_LOCAL_API_KEY) || ''
      : '';
    const storedMaxIssues = localStorage.getItem(STORAGE_KEY_MAX_ISSUES);

    setRememberKeys(shouldRemember);

    if (storedGithub || storedOpenRouter) {
      setApiKeys({
        githubToken: storedGithub,
        openRouterKey: storedOpenRouter,
      });
    }

    if (storedProvider === 'openrouter' || storedProvider === 'local') {
      setAiProvider(storedProvider);
      setLocalProvider(storedProvider);
    }

    if (storedEndpoint || storedModel || storedLocalApiKey) {
      setLocalConfig({
        endpoint: storedEndpoint || undefined,
        model: storedModel || undefined,
        apiKey: storedLocalApiKey || undefined,
      });
    }
    if (storedEndpoint) setLocalEndpointInput(storedEndpoint);
    if (storedModel) setLocalModelInput(storedModel);
    if (storedLocalApiKey) setLocalApiKeyInput(storedLocalApiKey);

    if (storedMaxIssues) {
      const parsed = parseInt(storedMaxIssues, 10);
      if (!isNaN(parsed)) {
        setMaxIssues(parsed);
      }
    }

    if (storedGithub) setLocalGithubToken(storedGithub);
    if (storedOpenRouter) setLocalOpenRouterKey(storedOpenRouter);

    if (storedMaxIssues) {
      const parsed = parseInt(storedMaxIssues, 10);

      if (!isNaN(parsed)) {
        setLocalMaxIssues(parsed);
      }
    }
  }, [setApiKeys, setMaxIssues, setAiProvider, setLocalConfig]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
    const { owner, repo } = parseRepoInput(repoInput);
    const cleanRepo = `${owner}/${repo}`;
    if (cleanRepo !== repoInput) {
      setRepoInput(cleanRepo);
    }

    setError(null);
    setSubmitted(true);
    useAppStore.getState().setScreen('fetching');
  };

  const handleSaveApiKeys = () => {
    setSaveStatus('saving');

    if (rememberKeys) {
      localStorage.setItem(STORAGE_KEY_GITHUB, localGithubToken);
      localStorage.setItem(STORAGE_KEY_OPENROUTER, localOpenRouterKey);
      localStorage.setItem(STORAGE_KEY_LOCAL_API_KEY, localApiKeyInput);
      localStorage.setItem(STORAGE_KEY_REMEMBER_KEYS, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_GITHUB);
      localStorage.removeItem(STORAGE_KEY_OPENROUTER);
      localStorage.removeItem(STORAGE_KEY_LOCAL_API_KEY);
      localStorage.setItem(STORAGE_KEY_REMEMBER_KEYS, 'false');
    }

    localStorage.setItem(STORAGE_KEY_AI_PROVIDER, localProvider);
    localStorage.setItem(STORAGE_KEY_LOCAL_ENDPOINT, localEndpointInput);
    localStorage.setItem(STORAGE_KEY_LOCAL_MODEL, localModelInput);
    localStorage.setItem(STORAGE_KEY_MAX_ISSUES, localMaxIssues.toString());

    setApiKeys({
      githubToken: localGithubToken,
      openRouterKey: localOpenRouterKey,
    });

    setAiProvider(localProvider);
    setLocalConfig({
      endpoint: localEndpointInput,
      model: localModelInput,
      apiKey: localApiKeyInput,
    });
    setMaxIssues(localMaxIssues);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 300);
  };

  const handleLoadFromHistory = async (key: string) => {
    setIsLoadingFromHistory(true);
    try {
      const [owner, repo] = key.split('/');
      const historyResult = await historyService.getHistoryEntry(owner, repo);

      if (historyResult.valid && historyResult.data) {
        // Set the issues and analyses directly
        setIssues(historyResult.data.issues);
        setAnalyses(historyResult.data.analyses);
        setRepoInput(key);
        addLog(`Loaded ${historyResult.data.issues.length} issues from history`, 'success');
        setScreen('report');
      } else {
        // Fall back to normal flow
        setRepoInput(key);
        setSubmitted(true);
        setScreen('fetching');
      }
    } catch (error) {
      console.error('Failed to load from history:', error);
      // Fall back to normal flow
      setRepoInput(key);
      setSubmitted(true);
      setScreen('fetching');
    } finally {
      setIsLoadingFromHistory(false);
    }
  };

  const recentHistory = history.slice(0, 3);
  const { theme, toggleTheme } = useTheme();
  return (
    <ScreenLayout centered>
      {/* Theme toggle — fixed top-right */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 10,
          background: 'none',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          borderRadius: '4px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          transition: 'all 0.15s ease',
        }}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
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
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
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
            gap: '12px',
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
              disabled={submitted || isLoadingFromHistory}
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
                pointerEvents: 'none',
              }}
            >
              <Github size={18} />
            </div>
          </div>

          {error && (
            <div
              style={{
                color: 'var(--status-error)',
                fontSize: '13px',
                paddingLeft: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>✗</span> {error}
            </div>
          )}

          <Button
            size="lg"
            disabled={!isValidRepo || submitted || isLoadingFromHistory}
            loading={submitted || isLoadingFromHistory}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 600,
              background:
                isValidRepo && !submitted && !isLoadingFromHistory
                  ? 'var(--text)'
                  : 'var(--bg-tertiary)',
              color:
                isValidRepo && !submitted && !isLoadingFromHistory
                  ? 'var(--bg)'
                  : 'var(--text-dim)',
              border: 'none',
              borderRadius: '12px',
              cursor:
                isValidRepo && !submitted && !isLoadingFromHistory ? 'pointer' : 'not-allowed',
              opacity: submitted || isLoadingFromHistory ? 0.7 : 1,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {isLoadingFromHistory
                ? 'Loading from History...'
                : submitted
                  ? 'Analyzing Repository...'
                  : 'Start Analysis'}
            </span>
          </Button>

          {/* Quick History Access */}
          {!isHistoryLoading && recentHistory.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Recent
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentHistory.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => handleLoadFromHistory(entry.key)}
                    disabled={isLoadingFromHistory}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      cursor: isLoadingFromHistory ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      opacity: isLoadingFromHistory ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingFromHistory) {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {entry.key}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={10} />
                      {formatTimeAgo(entry.fetchedAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => useAppStore.getState().setScreen('history')}
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
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <History size={14} />
              View History ({history.length} repositories)
            </button>
          </div>

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
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    GitHub Token (optional, for higher rate limits)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      value={localGithubToken}
                      onChange={(e) => {
                        setLocalGithubToken(e.target.value);
                        setSaveStatus('idle');
                      }}
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
                    <Key
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    OpenRouter API Key (required for analysis)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      value={localOpenRouterKey}
                      onChange={(e) => {
                        setLocalOpenRouterKey(e.target.value);
                        setSaveStatus('idle');
                      }}
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
                    <Key
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    AI Provider
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '4px',
                    }}
                  >
                    {(
                      [
                        { value: 'openrouter', label: 'OpenRouter' },
                        { value: 'local', label: 'Local (Ollama / LMStudio)' },
                      ] as { value: AIProvider; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setLocalProvider(opt.value);
                          setSaveStatus('idle');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          background: localProvider === opt.value ? 'var(--text)' : 'transparent',
                          color: localProvider === opt.value ? 'var(--bg)' : 'var(--text-muted)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {localProvider === 'local' && (
                  <>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginBottom: '6px',
                        }}
                      >
                        Local Endpoint (Ollama: http://localhost:11434/v1 · LMStudio:
                        http://localhost:1234/v1)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={localEndpointInput}
                          onChange={(e) => {
                            setLocalEndpointInput(e.target.value);
                            setSaveStatus('idle');
                          }}
                          placeholder={CONFIG.DEFAULT_LOCAL_ENDPOINT}
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
                        <Server
                          size={14}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-dim)',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginBottom: '6px',
                        }}
                      >
                        Local Model Name
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={localModelInput}
                          onChange={(e) => {
                            setLocalModelInput(e.target.value);
                            setSaveStatus('idle');
                          }}
                          placeholder={CONFIG.DEFAULT_LOCAL_MODEL}
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
                        <Server
                          size={14}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-dim)',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginBottom: '6px',
                        }}
                      >
                        Local API Key (optional — only if your server requires one)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="password"
                          value={localApiKeyInput}
                          onChange={(e) => {
                            setLocalApiKeyInput(e.target.value);
                            setSaveStatus('idle');
                          }}
                          placeholder="lm-studio"
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
                        <Key
                          size={14}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-dim)',
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Max Issues to Parse ({CONFIG.MIN_MAX_ISSUES}-{CONFIG.MAX_MAX_ISSUES})
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={localMaxIssues}
                      onChange={(e) => {
                        setLocalMaxIssues(parseInt(e.target.value, 10));
                        setSaveStatus('idle');
                      }}
                      min={CONFIG.MIN_MAX_ISSUES}
                      max={CONFIG.MAX_MAX_ISSUES}
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
                    <GitPullRequest
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-dim)',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Limits the number of issues fetched from GitHub. Lower values are faster.
                  </div>
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberKeys}
                    onChange={(e) => {
                      setRememberKeys(e.target.checked);
                      setSaveStatus('idle');
                    }}
                  />
                  Remember API keys
                </label>

                <Button
                  onClick={handleSaveApiKeys}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    background: saveStatus === 'saved' ? 'var(--status-success)' : 'var(--text)',
                    color: 'var(--bg)',
                  }}
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2
                        size={14}
                        style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }}
                      />
                      Saving...
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <Check size={14} style={{ marginRight: '6px' }} />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save size={14} style={{ marginRight: '6px' }} />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-dim)',
                background: 'var(--bg-secondary)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              built by{' '}
              <a
                href="https://github.com/vee1e"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'inherit',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  transition: 'color 0.2s',
                }}
              >
                Lakshit Verma
              </a>
            </span>
          </div>
        </form>
      </div>
    </ScreenLayout>
  );
}
