import { create } from 'zustand';
import type { Issue, AnalysisResult, LogEntry, FetchProgress, AppScreen, LogType, RankedIssue, HistoryMetadata } from '../lib/types';
import { historyService } from '../lib/history/historyService';
import { CONFIG } from '../lib/constants';

function timestamp(): string {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

interface AppState {
    // Navigation
    currentScreen: AppScreen;
    setScreen: (screen: AppScreen) => void;

    // Input
    repoInput: string;
    isValidRepo: boolean;
    setRepoInput: (input: string) => void;

    // API Keys
    githubToken: string;
    openRouterKey: string;
    setApiKeys: (keys: { githubToken?: string; openRouterKey?: string }) => void;

    // Settings
    maxIssues: number;
    setMaxIssues: (max: number) => void;

    // Fetching Progress
    fetchProgress: FetchProgress;
    setFetchProgress: (progress: Partial<FetchProgress>) => void;

    // Issues & Analysis
    issues: Issue[];
    analyses: Map<number, AnalysisResult>;
    setIssues: (issues: Issue[]) => void;
    addIssue: (issue: Issue) => void;
    setAnalysis: (issueNumber: number, result: AnalysisResult) => void;
    setAnalyses: (analyses: Map<number, AnalysisResult>) => void;

    // Ranked results
    getRankedIssues: () => RankedIssue[];

    // Report View State
    selectedIssueId: number | null;
    searchQuery: string;
    selectIssue: (id: number | null) => void;
    setSearchQuery: (query: string) => void;

    // Log
    logEntries: LogEntry[];
    addLog: (message: string, type?: LogType) => void;
    clearLogs: () => void;

    // Cancel
    isCancelled: boolean;
    cancel: () => void;

    // Reset
    reset: () => void;

    // History
    history: Array<{ key: string; metadata: HistoryMetadata; fetchedAt: number }>;
    isHistoryLoading: boolean;
    loadHistory: () => Promise<void>;
    deleteFromHistory: (owner: string, repo: string) => Promise<void>;
    clearAllHistory: () => Promise<void>;
}

import { validateRepoInput } from '../lib/utils/validators';

export const useAppStore = create<AppState>((set, get) => ({
    // Navigation
    currentScreen: 'input',
    setScreen: (screen) => set({ currentScreen: screen }),

    // Input
    repoInput: '',
    isValidRepo: false,
    setRepoInput: (input) => {
        const { valid } = validateRepoInput(input);
        set({ repoInput: input, isValidRepo: valid });
    },

    // API Keys
    githubToken: '',
    openRouterKey: '',
    setApiKeys: (keys) => set((state) => ({ ...state, ...keys })),

    // Fetching Progress
    fetchProgress: { phase: 'fetching', current: 0, total: 0 },
    setFetchProgress: (progress) =>
        set((state) => ({
            fetchProgress: { ...state.fetchProgress, ...progress },
        })),

    // Issues & Analysis
    issues: [],
    analyses: new Map(),
    setIssues: (issues) => set({ issues }),
    addIssue: (issue) =>
        set((state) => ({
            issues: [...state.issues, issue],
        })),
    setAnalysis: (issueNumber, result) =>
        set((state) => {
            const newAnalyses = new Map(state.analyses);
            newAnalyses.set(issueNumber, result);
            return { analyses: newAnalyses };
        }),
    setAnalyses: (analyses) => set({ analyses }),

    // Ranked results
    getRankedIssues: () => {
        const { issues, analyses } = get();
        return issues
            .map((issue) => ({
                ...issue,
                analysis: analyses.get(issue.number),
                score: analyses.get(issue.number)?.doability_score ?? 0,
            }))
            .sort((a, b) => b.score - a.score);
    },

    // Report View State
    selectedIssueId: null,
    searchQuery: '',
    selectIssue: (id) => set({ selectedIssueId: id }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    // Log
    logEntries: [],
    addLog: (message, type = 'info') =>
        set((state) => ({
            logEntries: [
                ...state.logEntries,
                { timestamp: timestamp(), message, type },
            ],
        })),
    clearLogs: () => set({ logEntries: [] }),

    // Cancel
    isCancelled: false,
    cancel: () => set({ isCancelled: true }),

    // Reset
    reset: () =>
        set({
            currentScreen: 'input',
            repoInput: '',
            isValidRepo: false,
            fetchProgress: { phase: 'fetching', current: 0, total: 0 },
            issues: [],
            analyses: new Map(),
            selectedIssueId: null,
            searchQuery: '',
            logEntries: [],
            isCancelled: false,
            history: [],
            isHistoryLoading: false,
        }),

    // Settings
    maxIssues: CONFIG.DEFAULT_MAX_ISSUES,
    setMaxIssues: (max) => set({ maxIssues: Math.max(CONFIG.MIN_MAX_ISSUES, Math.min(CONFIG.MAX_MAX_ISSUES, max)) }),

    // History
    history: [],
    isHistoryLoading: false,
    loadHistory: async () => {
        set({ isHistoryLoading: true });
        try {
            const repos = await historyService.getAllHistory();
            set({ history: repos });
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            set({ isHistoryLoading: false });
        }
    },
    deleteFromHistory: async (owner: string, repo: string) => {
        await historyService.deleteFromHistory(owner, repo);
        const repos = await historyService.getAllHistory();
        set({ history: repos });
    },
    clearAllHistory: async () => {
        await historyService.clearAllHistory();
        set({ history: [] });
    },
}));
