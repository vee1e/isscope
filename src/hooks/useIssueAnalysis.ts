import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { analyzeAllIssues } from '../lib/api/openrouter';
import { historyService } from '../lib/history/historyService';
import type { Issue } from '../lib/types';

export function useIssueAnalysis() {
    const { setAnalysis, setFetchProgress, setScreen, addLog, repoInput } = useAppStore();
    const cancelRef = useRef(false);

    const analyzeIssues = useCallback(
        async (issues: Issue[]) => {
            cancelRef.current = false;
            setScreen('analyzing');
            
            // Check for history analyses
            const { owner, repo } = parseRepoInput(repoInput);
            addLog('Checking history for previous analyses...', 'info');
            
            const issuesToAnalyze: Issue[] = [];
            const historyAnalysesResults: Array<{ issueNumber: number; result: Awaited<ReturnType<typeof historyService.shouldUseHistoryAnalysis>> }> = [];
            
            for (const issue of issues) {
                const historyResult = await historyService.shouldUseHistoryAnalysis(owner, repo, issue.number, issue);
                historyAnalysesResults.push({ issueNumber: issue.number, result: historyResult });
                
                if (!historyResult.useHistory) {
                    issuesToAnalyze.push(issue);
                }
            }
            
            const historyCount = issues.length - issuesToAnalyze.length;
            if (historyCount > 0) {
                addLog(`✓ Using ${historyCount} previous analyses from history`, 'success');
                // Apply history analyses
                for (const { issueNumber, result } of historyAnalysesResults) {
                    if (result.useHistory && result.historyAnalysis) {
                        setAnalysis(issueNumber, result.historyAnalysis);
                    }
                }
            }
            
            if (issuesToAnalyze.length === 0) {
                addLog('✓ All analyses loaded from history', 'success');
                setScreen('report');
                return;
            }
            
            addLog(`Analyzing ${issuesToAnalyze.length} issues with AI...`, 'info');
            addLog(`Model: ${import.meta.env.VITE_MODEL_NAME || 'arcee-ai/trinity-large-preview:free'}`, 'info');
            setFetchProgress({ phase: 'analyzing', current: 0, total: issuesToAnalyze.length });

            const analyses = await analyzeAllIssues(
                issuesToAnalyze,
                (current, total) => {
                    setFetchProgress({ current, total, phase: 'analyzing' });
                },
                (msg) => {
                    addLog(msg, msg.startsWith('✓') ? 'success' : msg.startsWith('✗') ? 'error' : msg.startsWith('⏳') ? 'warning' : 'info');
                },
                () => cancelRef.current
            );

            // Apply new analyses to store
            for (const [issueNumber, result] of analyses) {
                setAnalysis(issueNumber, result);
            }
            
            // Save analyses to history
            try {
                await historyService.updateHistoryAnalyses(owner, repo, analyses);
                addLog('✓ Analyses saved to history', 'success');
            } catch (error) {
                addLog('Warning: Failed to save analyses to history', 'warning');
            }

            addLog(`✓ Analysis complete: ${analyses.size} new, ${historyCount} from history`, 'success');

            // Transition to report
            setScreen('report');
        },
        [setAnalysis, setFetchProgress, setScreen, addLog, repoInput]
    );

    const cancel = useCallback(() => {
        cancelRef.current = true;
    }, []);

    return { analyzeIssues, cancel };
}

function parseRepoInput(input: string): { owner: string; repo: string } {
    // Handle full URL or owner/repo format
    if (input.includes('github.com')) {
        const match = input.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
        }
    }
    
    const parts = input.split('/');
    if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
    }
    
    throw new Error('Invalid repository format');
}
