import React, { useMemo, useCallback } from 'react';
import { SplitPane } from '../components/layout/SplitPane';
import { IssueList } from '../components/issue/IssueList';
import { IssueDetail } from '../components/issue/IssueDetail';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { useAppStore } from '../store/appStore';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import type { RankedIssue } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Download, RotateCcw } from 'lucide-react';
import { parseRepoInput } from '../lib/utils/validators';
import { exportToMarkdown, downloadMarkdown } from '../lib/utils/exporters';

export function ReportScreen() {
    const {
        getRankedIssues,
        selectedIssueId,
        selectIssue,
        searchQuery,
        setSearchQuery,
    } = useAppStore();

    const rankedIssues = getRankedIssues();

    // Filter by search
    const filteredIssues = useMemo(() => {
        if (!searchQuery.trim()) return rankedIssues;
        const q = searchQuery.toLowerCase();
        return rankedIssues.filter(
            (issue) =>
                issue.title.toLowerCase().includes(q) ||
                issue.labels.some((l) => l.name.toLowerCase().includes(q)) ||
                (issue.body && issue.body.toLowerCase().includes(q)) ||
                `#${issue.number}`.includes(q)
        );
    }, [rankedIssues, searchQuery]);

    // Keyboard navigation
    const handleNavSelect = useCallback(
        (index: number) => {
            if (filteredIssues[index]) {
                selectIssue(filteredIssues[index].number);
            }
        },
        [filteredIssues, selectIssue]
    );

    const { selectedIndex, setSelectedIndex } = useKeyboardNavigation(
        filteredIssues.length,
        handleNavSelect
    );

    // Sync keyboard index with selected issue (e.g. on click)
    React.useEffect(() => {
        if (selectedIssueId) {
            const index = filteredIssues.findIndex((i) => i.number === selectedIssueId);
            if (index !== -1 && index !== selectedIndex) {
                setSelectedIndex(index);
            }
        }
    }, [selectedIssueId, filteredIssues, selectedIndex, setSelectedIndex]);

    // Auto-select first issue if none selected
    React.useEffect(() => {
        if (!selectedIssueId && filteredIssues.length > 0) {
            selectIssue(filteredIssues[0].number);
        }
    }, [filteredIssues, selectedIssueId, selectIssue]);

    const selectedIssue = useMemo<RankedIssue | null>(() => {
        return filteredIssues.find((i) => i.number === selectedIssueId) || null;
    }, [filteredIssues, selectedIssueId]);

    const { repoInput, reset } = useAppStore();

    // Header actions
    const handleExport = useCallback(() => {
        const ranked = getRankedIssues();
        const { owner, repo } = parseRepoInput(repoInput);
        const md = exportToMarkdown(ranked, `${owner}/${repo}`);
        downloadMarkdown(md, `isscope-report-${owner}-${repo}.md`);
        useAppStore.getState().addLog('Report exported as Markdown.', 'success');
    }, [getRankedIssues, repoInput]);

    return (
        <ScreenLayout>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg)',
            }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)' }}>
                    Report: {repoInput}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <Button variant="ghost" size="sm" onClick={handleExport} title="Export Markdown report">
                        <Download size={13} /> Export
                    </Button>
                    <Button variant="ghost" size="sm" onClick={reset} title="New analysis">
                        <RotateCcw size={13} /> New
                    </Button>
                </div>
            </div>
            <SplitPane
                defaultSplit={42}
                left={
                    <IssueList
                        issues={filteredIssues}
                        selectedId={selectedIssueId}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSelect={selectIssue}
                        selectedIndex={selectedIndex}
                    />
                }
                right={<IssueDetail issue={selectedIssue} />}
            />
        </ScreenLayout>
    );
}
