import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { analyzeAllIssues } from '../lib/api/openrouter';
import type { Issue } from '../lib/types';

export function useIssueAnalysis() {
    const { setAnalysis, setFetchProgress, setScreen, addLog } = useAppStore();
    const cancelRef = useRef(false);

    const analyzeIssues = useCallback(
        async (issues: Issue[]) => {
            cancelRef.current = false;
            setScreen('analyzing');
            setFetchProgress({ phase: 'analyzing', current: 0, total: issues.length });
            addLog(`Starting AI analysis for ${issues.length} issues...`, 'info');
            addLog(`Model: ${import.meta.env.VITE_MODEL_NAME || 'arcee-ai/trinity-large-preview:free'}`, 'info');

            const analyses = await analyzeAllIssues(
                issues,
                (current, total) => {
                    setFetchProgress({ current, total, phase: 'analyzing' });
                },
                (msg) => {
                    addLog(msg, msg.startsWith('✓') ? 'success' : msg.startsWith('✗') ? 'error' : msg.startsWith('⏳') ? 'warning' : 'info');
                },
                () => cancelRef.current
            );

            // Apply all analyses to store
            for (const [issueNumber, result] of analyses) {
                setAnalysis(issueNumber, result);
            }

            addLog(`✓ Analysis complete: ${analyses.size}/${issues.length} issues analyzed`, 'success');

            // Transition to report
            setScreen('report');
        },
        [setAnalysis, setFetchProgress, setScreen, addLog]
    );

    const cancel = useCallback(() => {
        cancelRef.current = true;
    }, []);

    return { analyzeIssues, cancel };
}
