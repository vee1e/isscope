import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { searchIssues, fetchAllIssueDetails, getRateLimitInfo } from '../lib/api/github';
import { parseRepoInput } from '../lib/utils/validators';

export function useGitHubIssues() {
    const {
        repoInput,
        setIssues,
        setFetchProgress,
        setScreen,
        addLog,
        isCancelled,
    } = useAppStore();
    const cancelRef = useRef(false);

    const fetchIssues = useCallback(async () => {
        const { owner, repo } = parseRepoInput(repoInput);
        cancelRef.current = false;

        setScreen('fetching');
        setFetchProgress({ phase: 'fetching', current: 0, total: 0 });
        addLog(`Starting fetch for ${owner}/${repo}`, 'info');

        try {
            // Phase 1: Search issues
            addLog('Connecting to GitHub API...', 'info');
            const issues = await searchIssues(owner, repo, (msg) => {
                addLog(msg, 'info');
            });

            if (cancelRef.current) {
                addLog('Fetch cancelled by user.', 'warning');
                return;
            }

            const rateLimit = getRateLimitInfo();
            addLog(`Found ${issues.length} open issues (not linked to PRs)`, 'success');
            addLog(`Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`, 'info');

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

            const finalRate = getRateLimitInfo();
            addLog(`Final rate limit: ${finalRate.remaining}/${finalRate.limit}`, 'info');

            return detailedIssues;
        } catch (err: any) {
            addLog(`✗ Error: ${err.message}`, 'error');
            throw err;
        }
    }, [repoInput, setIssues, setFetchProgress, setScreen, addLog]);

    const cancel = useCallback(() => {
        cancelRef.current = true;
    }, []);

    return { fetchIssues, cancel, isCancelled };
}
