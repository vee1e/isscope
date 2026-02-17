import React, { useRef, useEffect, useState } from 'react';
import { Panel } from '../components/ui/Panel';
import { ProgressBar } from '../components/ui/ProgressBar';
import { TerminalLog } from '../components/terminal/TerminalLog';
import { Button } from '../components/ui/Button';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { useAppStore } from '../store/appStore';
import { useTerminalLog } from '../hooks/useTerminalLog';
import { parseRepoInput } from '../lib/utils/validators';
import { XCircle, RefreshCw, Database } from 'lucide-react';

interface LoadingScreenProps {
    historyInfo?: { fromHistory: boolean; issueCount: number; fetchedAt: Date } | null;
    onForceRefresh?: () => void;
}

export function LoadingScreen({ historyInfo, onForceRefresh }: LoadingScreenProps) {
    const { repoInput, fetchProgress, cancel } = useAppStore();
    const { logEntries, scrollRef } = useTerminalLog();
    const { owner, repo } = parseRepoInput(repoInput);
    
    // Track phase start time
    const phaseStartTimeRef = useRef<number>(Date.now());
    const lastPhaseRef = useRef<string>(fetchProgress.phase);
    
    // Update start time when phase changes
    useEffect(() => {
        if (lastPhaseRef.current !== fetchProgress.phase) {
            phaseStartTimeRef.current = Date.now();
            lastPhaseRef.current = fetchProgress.phase;
        }
    }, [fetchProgress.phase]);

    const phaseLabel = fetchProgress.phase === 'fetching'
        ? 'Fetching Issues'
        : 'Analyzing with AI';

    return (
        <ScreenLayout>
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}
            >
                <div
                    style={{ width: '100%', maxWidth: '700px' }}
                >
                    <Panel title={phaseLabel}>
                        {/* Repository info */}
                        <div
                            style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                marginBottom: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                            }}
                        >
                            <div>
                                <span style={{ color: 'var(--text-muted)' }}>Repository: </span>
                                <span style={{ color: 'var(--text)' }}>{owner}/{repo}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)' }}>Filter: </span>
                                <span style={{ color: 'var(--text-dim)' }}>is:issue state:open -linked:pr</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)' }}>Phase: </span>
                                <span style={{ color: fetchProgress.phase === 'analyzing' ? 'var(--status-warning)' : 'var(--text)' }}>
                                    {phaseLabel}
                                </span>
                            </div>
                            {historyInfo?.fromHistory && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Source: </span>
                                    <span style={{ 
                                        color: 'var(--status-success)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        fontSize: '11px',
                                    }}>
                                        <Database size={10} />
                                        From History ({historyInfo.issueCount} issues)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Progress bar */}
                        <ProgressBar
                            current={fetchProgress.current}
                            total={fetchProgress.total}
                            label="Progress"
                            startTime={phaseStartTimeRef.current}
                        />

                        {/* Log panel */}
                        <div style={{ marginTop: '16px' }}>
                            <TerminalLog entries={logEntries} maxHeight="280px" scrollRef={scrollRef} />
                        </div>

                        {/* Action buttons */}
                        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between' }}>
                            {historyInfo?.fromHistory && onForceRefresh && fetchProgress.phase === 'fetching' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        onForceRefresh();
                                    }}
                                >
                                    <RefreshCw size={13} />
                                    Refresh Data
                                </Button>
                            )}
                            <div style={{ marginLeft: 'auto' }}>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                        cancel();
                                        useAppStore.getState().setScreen('input');
                                        useAppStore.getState().addLog('Operation cancelled by user.', 'warning');
                                    }}
                                >
                                    <XCircle size={13} />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>
        </ScreenLayout>
    );
}
