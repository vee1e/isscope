import React, { useEffect, useCallback } from 'react';
import { InputScreen } from './screens/InputScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ReportScreen } from './screens/ReportScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { useAppStore } from './store/appStore';
import { useGitHubIssues } from './hooks/useGitHubIssues';
import { useIssueAnalysis } from './hooks/useIssueAnalysis';

function App() {
    const { currentScreen, issues, analyses, setScreen, addLog } = useAppStore();
    const { fetchIssues, isUsingHistory, historyInfo } = useGitHubIssues();
    const { analyzeIssues } = useIssueAnalysis();

    const startAnalysis = useCallback(async (forceRefresh = false) => {
        try {
            const fetchedIssues = await fetchIssues(forceRefresh);
            if (!fetchedIssues || fetchedIssues.length === 0) {
                addLog('No issues found. Returning to input.', 'warning');
                setScreen('input');
                return;
            }

            // Check if all analyses are already in history
            const allAnalyzed = fetchedIssues.every((issue: { number: number }) => analyses.has(issue.number));
            if (allAnalyzed && analyses.size > 0) {
                addLog('All analyses loaded from history, showing report...', 'success');
                setScreen('report');
                return;
            }

            await analyzeIssues(fetchedIssues);
        } catch (err: any) {
            addLog(`Fatal error: ${err.message}`, 'error');
        }
    }, [fetchIssues, analyzeIssues, analyses, addLog, setScreen]);

    // When screen transitions to 'fetching', start the pipeline
    useEffect(() => {
        if (currentScreen === 'fetching' && issues.length === 0) {
            startAnalysis();
        }
    }, [currentScreen, startAnalysis]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                background: 'var(--bg)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
                {currentScreen === 'input' && <InputScreen onForceRefresh={() => startAnalysis(true)} />}
                {(currentScreen === 'fetching' || currentScreen === 'analyzing') && <LoadingScreen historyInfo={historyInfo} onForceRefresh={() => startAnalysis(true)} />}
                {currentScreen === 'report' && <ReportScreen />}
                {currentScreen === 'history' && <HistoryScreen />}
            </div>
        </div>
    );
}

export default App;
