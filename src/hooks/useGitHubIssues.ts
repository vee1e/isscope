import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { searchIssues, fetchAllIssueDetails, getRateLimitInfo } from '../lib/api/github';
import { parseRepoInput } from '../lib/utils/validators';
import { historyService } from '../lib/history/historyService';
import type { Issue } from '../lib/types';

export function useGitHubIssues() {
    const {
        repoInput,
        setIssues,
        setAnalyses,
        analyses,
        setFetchProgress,
        setScreen,
        addLog,
        isCancelled,
        loadHistory,
        maxIssues,
    } = useAppStore();
    const cancelRef = useRef(false);
    const [isUsingHistory, setIsUsingHistory] = useState(false);
    const [historyInfo, setHistoryInfo] = useState<{ fromHistory: boolean; issueCount: number; fetchedAt: Date } | null>(null);

    const checkHistory = useCallback(async (owner: string, repo: string, freshIssues: Issue[]) => {
        const result = await historyService.shouldUseHistory(owner, repo, freshIssues);
        return result;
    }, []);

    const fetchIssues = useCallback(async (forceRefresh = false) => {
        const { owner, repo } = parseRepoInput(repoInput);
        cancelRef.current = false;
        setIsUsingHistory(false);
        setHistoryInfo(null);

        setScreen('fetching');
        setFetchProgress({ phase: 'fetching', current: 0, total: 0 });
        addLog(`Starting fetch for ${owner}/${repo}`, 'info');

        try {
            // Phase 1: Search issues
            addLog(`Connecting to GitHub API (max ${maxIssues} issues)...`, 'info');
            const issues = await searchIssues(owner, repo, maxIssues, (msg: string) => {
                addLog(msg, 'info');
            });

            if (cancelRef.current) {
                addLog('Fetch cancelled by user.', 'warning');
                return;
            }

            const rateLimit = getRateLimitInfo();
            addLog(`Found ${issues.length} open issues (not linked to PRs)`, 'success');
            addLog(`Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`, 'info');

            // Check history before fetching details
            if (!forceRefresh) {
                addLog('Checking history for existing data...', 'info');
                const historyResult = await checkHistory(owner, repo, issues);
                
                if (historyResult.useHistory && historyResult.historyData) {
                    addLog(`✓ Using history data (${historyResult.historyData.issues.length} issues)`, 'success');
                    setIssues(historyResult.historyData.issues);
                    
                    // Restore analyses from history
                    const historyAnalyses = historyResult.historyData.analyses;
                    if (historyAnalyses && historyAnalyses.size > 0) {
                        setAnalyses(new Map(historyAnalyses));
                        addLog(`✓ Restored ${historyAnalyses.size} analyses from history`, 'success');
                    }
                    
                    setIsUsingHistory(true);
                    setHistoryInfo({
                        fromHistory: true,
                        issueCount: historyResult.historyData.issues.length,
                        fetchedAt: new Date(historyResult.historyData.fetchedAt),
                    });
                    
                    // Refresh history list
                    await loadHistory();
                    
                    return historyResult.historyData.issues;
                } else {
                    addLog(`History not valid: ${historyResult.reason}`, 'info');
                }
            } else {
                addLog('Force refresh requested, skipping history', 'info');
            }

            setFetchProgress({ total: issues.length, current: 0 });

            // Phase 2: Fetch details (comments + timeline)
            addLog('Fetching issue details (comments, timeline)...', 'info');
            const detailedIssues = await fetchAllIssueDetails(
                owner,
                repo,
                issues,
                (current, total, msg) => {
                    setFetchProgress({ current, total });
                    addLog(msg, 'info');
                },
                () => cancelRef.current
            );

            if (cancelRef.current) {
                addLog('Fetch cancelled by user.', 'warning');
                return;
            }

            setIssues(detailedIssues);
            addLog(`✓ All ${detailedIssues.length} issues fetched with details`, 'success');

            // Save to history
            addLog('Saving to history...', 'info');
            await historyService.saveToHistory(owner, repo, detailedIssues, new Map());
            await loadHistory();
            addLog('✓ Data saved to history', 'success');

            const finalRate = getRateLimitInfo();
            addLog(`Final rate limit: ${finalRate.remaining}/${finalRate.limit}`, 'info');

            setHistoryInfo({
                fromHistory: false,
                issueCount: detailedIssues.length,
                fetchedAt: new Date(),
            });

            return detailedIssues;
        } catch (err: any) {
            addLog(`✗ Error: ${err.message}`, 'error');
            throw err;
        }
    }, [repoInput, setIssues, setAnalyses, analyses, setFetchProgress, setScreen, addLog, checkHistory, loadHistory]);

    const cancel = useCallback(() => {
        cancelRef.current = true;
    }, []);

    return { fetchIssues, cancel, isCancelled, isUsingHistory, historyInfo };
}
