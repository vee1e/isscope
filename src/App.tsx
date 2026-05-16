import React, { useEffect, useCallback } from 'react';
import { InputScreen } from './screens/InputScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { ReportScreen } from './screens/ReportScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { useAppStore } from './store/appStore';
import { useGitHubIssues } from './hooks/useGitHubIssues';
import { useIssueAnalysis } from './hooks/useIssueAnalysis';
import { Inbox } from 'lucide-react';

function App() {
  const { currentScreen, issues, analyses, setScreen, addLog } = useAppStore();
  const { fetchIssues, historyInfo } = useGitHubIssues();
  const { analyzeIssues } = useIssueAnalysis();

  const startAnalysis = useCallback(
    async (forceRefresh = false) => {
      try {
       const fetchedIssues = await fetchIssues(forceRefresh);
        if (!fetchedIssues || fetchedIssues.length === 0) {
          addLog('No open unlinked issues found for this repository.', 'warning');
          setScreen('no-issues');
          return;
        }

        // Check if all analyses are already in history
        const allAnalyzed = fetchedIssues.every((issue: { number: number }) =>
          analyses.has(issue.number),
        );
        if (allAnalyzed && analyses.size > 0) {
          addLog('All analyses loaded from history, showing report...', 'success');
          setScreen('report');
          return;
        }

        await analyzeIssues(fetchedIssues);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        addLog(`Fatal error: ${errorMessage}`, 'error');
      }
    },
    [fetchIssues, analyzeIssues, analyses, addLog, setScreen],
  );

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentScreen === 'input' && <InputScreen />}
        {currentScreen === 'input' && <InputScreen />}
        {currentScreen === 'no-issues' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            <Inbox size={44} style={{ color: 'var(--text-dim)', opacity: 0.4 }} />
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                This repo has no open, unlinked issues.
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                All issues may already be linked to a PR, or none are open yet.
              </span>
            </div>
            <button
              onClick={() => setScreen('input')}
              style={{
                marginTop: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              ← Try another repository
            </button>
          </div>
        )}
        {(currentScreen === 'fetching' || currentScreen === 'analyzing') && (
          <LoadingScreen historyInfo={historyInfo} onForceRefresh={() => startAnalysis(true)} />
        )}
        {currentScreen === 'report' && <ReportScreen />}
        {currentScreen === 'history' && <HistoryScreen />}
      </div>
    </div>
  );
}

export default App;
