import React, { useEffect } from 'react';
import { InputScreen } from './screens/InputScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ReportScreen } from './screens/ReportScreen';
import { useAppStore } from './store/appStore';
import { useGitHubIssues } from './hooks/useGitHubIssues';
import { useIssueAnalysis } from './hooks/useIssueAnalysis';

function App() {
    const { currentScreen, issues, repoInput, reset, getRankedIssues } = useAppStore();
    const { fetchIssues } = useGitHubIssues();
    const { analyzeIssues } = useIssueAnalysis();

    // When screen transitions to 'fetching', start the pipeline
    useEffect(() => {
        if (currentScreen === 'fetching' && issues.length === 0) {
            (async () => {
                try {
                    const fetchedIssues = await fetchIssues();
                    if (fetchedIssues && fetchedIssues.length > 0) {
                        await analyzeIssues(fetchedIssues);
                    } else {
                        useAppStore.getState().addLog('No issues found. Returning to input.', 'warning');
                        useAppStore.getState().setScreen('input');
                    }
                } catch (err: any) {
                    useAppStore.getState().addLog(`Fatal error: ${err.message}`, 'error');
                }
            })();
        }
    }, [currentScreen]);

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
                {currentScreen === 'input' && <InputScreen />}
                {(currentScreen === 'fetching' || currentScreen === 'analyzing') && <LoadingScreen />}
                {currentScreen === 'report' && <ReportScreen />}
            </div>
        </div>
    );
}

export default App;
