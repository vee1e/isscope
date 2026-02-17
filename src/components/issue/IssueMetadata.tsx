import React from 'react';
import type { AnalysisResult } from '../../lib/types';
import {
    statusLabel,
    complexityLabel,
    friendlinessLabel,
    progressLabel,
} from '../../lib/utils/formatters';
import { getScoreClass } from '../../lib/types';

interface IssueMetadataProps {
    analysis: AnalysisResult;
}

export function IssueMetadata({ analysis }: IssueMetadataProps) {
    return (
        <div
            style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
            }}
        >
            {/* Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Doability</span>
                <span className={getScoreClass(analysis.doability_score)} style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
                    {analysis.doability_score}/100
                </span>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ color: 'var(--text)' }}>{statusLabel(analysis.status)}</span>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                <span style={{ color: 'var(--text)' }}>{progressLabel(analysis.progress_estimate)}</span>
            </div>

            {/* Complexity */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Complexity</span>
                <span style={{ color: 'var(--text)' }}>{complexityLabel(analysis.complexity)} ({analysis.complexity}/5)</span>
            </div>

            {/* Newcomer Friendliness */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Friendliness</span>
                <span style={{ color: 'var(--text)' }}>{friendlinessLabel(analysis.newcomer_friendliness)} ({analysis.newcomer_friendliness}/5)</span>
            </div>

            {/* Actionable */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Actionable</span>
                <span style={{ color: analysis.is_actionable_code_change ? 'var(--status-success)' : 'var(--text-dim)' }}>
                    {analysis.is_actionable_code_change ? '✓ Yes' : '✗ No'}
                </span>
            </div>

            {/* Merge blocker */}
            {analysis.not_mergeable_reason && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Blocker</span>
                    <span style={{ color: 'var(--status-warning)', maxWidth: '60%', textAlign: 'right' }}>
                        {analysis.not_mergeable_reason}
                    </span>
                </div>
            )}

            {/* Skills */}
            <div style={{ marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Skills: </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {analysis.skills_required.length > 0 ? (
                        analysis.skills_required.map((skill) => (
                            <span
                                key={skill}
                                style={{
                                    padding: '1px 6px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-tertiary)',
                                }}
                            >
                                {skill}
                            </span>
                        ))
                    ) : (
                        <span style={{ color: 'var(--text-dim)' }}>none specified</span>
                    )}
                </div>
            </div>
        </div>
    );
}
