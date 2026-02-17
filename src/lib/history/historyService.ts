import type { Issue, AnalysisResult, HistoryEntry, HistoryMetadata, HistoryCheckResult } from '../types';

const DB_NAME = 'isscope-history';
const DB_VERSION = 1;
const STORE_NAME = 'repositories';

class HistoryService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.doInit();
        return this.initPromise;
    }

    private async doInit(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };
        });
    }

    private getStore(mode: IDBTransactionMode): IDBObjectStore {
        if (!this.db) throw new Error('History not initialized');
        const transaction = this.db.transaction(STORE_NAME, mode);
        return transaction.objectStore(STORE_NAME);
    }

    private calculateIssueActivityRate(issues: Issue[]): HistoryMetadata['issuesActivity'] {
        if (issues.length === 0) {
            return {
                newIssuesPerDay: 0,
                lastIssueCreatedAt: new Date().toISOString(),
                sampleSize: 0,
            };
        }

        // Sort by creation date
        const sorted = [...issues].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const oldest = new Date(sorted[0].created_at);
        const newest = new Date(sorted[sorted.length - 1].created_at);
        const daysSpan = Math.max(1, (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
            newIssuesPerDay: issues.length / daysSpan,
            lastIssueCreatedAt: sorted[sorted.length - 1].created_at,
            sampleSize: issues.length,
        };
    }

    private calculateCommentActivityRate(issues: Issue[]): HistoryMetadata['commentsActivity'] {
        let totalComments = 0;
        let lastCommentDate: Date | null = null;

        for (const issue of issues) {
            if (issue.comments && issue.comments.length > 0) {
                totalComments += issue.comments.length;
                for (const comment of issue.comments) {
                    const date = new Date(comment.created_at);
                    if (!lastCommentDate || date > lastCommentDate) {
                        lastCommentDate = date;
                    }
                }
            }
        }

        if (totalComments === 0 || !lastCommentDate) {
            return {
                newCommentsPerDay: 0,
                lastCommentCreatedAt: new Date().toISOString(),
                sampleSize: 0,
            };
        }

        // Use 30 days as default span for comment rate calculation
        // or use the time since first comment if repo is newer
        const daysSpan = 30;

        return {
            newCommentsPerDay: totalComments / daysSpan,
            lastCommentCreatedAt: lastCommentDate.toISOString(),
            sampleSize: totalComments,
        };
    }

    private shouldUseHistoryIssues(historyEntry: HistoryEntry, freshIssues: Issue[]): boolean {
        const now = Date.now();
        const age = now - historyEntry.fetchedAt;
        const { issuesActivity, commentsActivity } = historyEntry.metadata;
        
        // Calculate expected new issues since history was saved
        const daysSinceHistory = age / (1000 * 60 * 60 * 24);
        const expectedNewIssues = issuesActivity.newIssuesPerDay * daysSinceHistory;
        
        // Check if issue count matches expectation
        const issueCountDiff = Math.abs(freshIssues.length - historyEntry.issues.length);
        const acceptableDiff = Math.max(1, expectedNewIssues * 2); // 2x tolerance
        
        if (issueCountDiff > acceptableDiff) {
            return false;
        }

        // For high-activity repos, shorter history validity
        if (issuesActivity.newIssuesPerDay > 10) {
            return age < 1000 * 60 * 30; // 30 minutes
        }
        if (issuesActivity.newIssuesPerDay > 5) {
            return age < 1000 * 60 * 60; // 1 hour
        }
        if (issuesActivity.newIssuesPerDay > 1) {
            return age < 1000 * 60 * 60 * 4; // 4 hours
        }
        
        // Low activity repos can use history longer
        return age < 1000 * 60 * 60 * 24; // 24 hours
    }

    private checkAnalysisValidity(
        historyEntry: HistoryEntry,
        issueNumber: number,
        freshIssue: Issue
    ): boolean {
        const historyIssue = historyEntry.issues.find(i => i.number === issueNumber);
        const historyAnalysis = historyEntry.analyses.get(issueNumber);
        
        if (!historyIssue || !historyAnalysis) {
            return false;
        }

        // Check if issue has new comments since analysis
        const historyCommentCount = historyIssue.comments?.length || 0;
        const freshCommentCount = freshIssue.comments?.length || 0;
        
        // Get the most recent comment date from history issue
        let historyLastCommentDate: Date | null = null;
        if (historyIssue.comments && historyIssue.comments.length > 0) {
            historyLastCommentDate = new Date(
                Math.max(...historyIssue.comments.map(c => new Date(c.created_at).getTime()))
            );
        }

        // Get most recent comment date from fresh issue
        let freshLastCommentDate: Date | null = null;
        if (freshIssue.comments && freshIssue.comments.length > 0) {
            freshLastCommentDate = new Date(
                Math.max(...freshIssue.comments.map(c => new Date(c.created_at).getTime()))
            );
        }

        // If there are new comments, re-analyze
        if (freshCommentCount > historyCommentCount) {
            // For high comment activity, re-analyze more frequently
            if (historyEntry.metadata.commentsActivity.newCommentsPerDay > 5) {
                return false;
            }
            
            // Check if new comments are significant (more than 2 new comments)
            if (freshCommentCount - historyCommentCount > 2) {
                return false;
            }
        }

        // If last comment date changed significantly, re-analyze
        if (historyLastCommentDate && freshLastCommentDate) {
            const daysSinceLastComment = 
                (freshLastCommentDate.getTime() - historyLastCommentDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // If more than 3 days of new discussion, re-analyze
            if (daysSinceLastComment > 3) {
                return false;
            }
        }

        // Check issue age - old issues (no activity in 90 days) keep analysis indefinitely
        const lastActivity = freshIssue.updated_at || freshIssue.created_at;
        const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceActivity > 90) {
            return true; // Old inactive issue - analysis stays valid
        }

        // Default: history analysis for 7 days for active issues
        const analysisAge = Date.now() - historyEntry.fetchedAt;
        return analysisAge < 1000 * 60 * 60 * 24 * 7;
    }

    async getHistoryEntry(owner: string, repo: string): Promise<HistoryCheckResult> {
        await this.init();
        const key = `${owner}/${repo}`;
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('readonly');
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const data = request.result as HistoryEntry | undefined;
                
                if (!data) {
                    resolve({ valid: false, reason: 'No history found' });
                    return;
                }

                // Convert analyses back to Map
                if (data.analyses && !(data.analyses instanceof Map)) {
                    data.analyses = new Map(Object.entries(data.analyses).map(
                        ([k, v]) => [parseInt(k, 10), v as AnalysisResult]
                    ));
                }

                resolve({ valid: true, data });
            };
        });
    }

    async shouldUseHistory(
        owner: string,
        repo: string,
        freshIssues: Issue[]
    ): Promise<{ useHistory: boolean; historyData?: HistoryEntry; reason?: string }> {
        const entry = await this.getHistoryEntry(owner, repo);
        
        if (!entry.valid || !entry.data) {
            return { useHistory: false, reason: entry.reason };
        }

        const shouldUse = this.shouldUseHistoryIssues(entry.data, freshIssues);
        
        return {
            useHistory: shouldUse,
            historyData: entry.data,
            reason: shouldUse ? 'History is fresh' : 'History expired based on activity',
        };
    }

    async shouldUseHistoryAnalysis(
        owner: string,
        repo: string,
        issueNumber: number,
        freshIssue: Issue
    ): Promise<{ useHistory: boolean; historyAnalysis?: AnalysisResult; reason?: string }> {
        const entry = await this.getHistoryEntry(owner, repo);
        
        if (!entry.valid || !entry.data) {
            return { useHistory: false, reason: 'No history found' };
        }

        const shouldUse = this.checkAnalysisValidity(entry.data, issueNumber, freshIssue);
        const historyAnalysis = entry.data.analyses.get(issueNumber);
        
        return {
            useHistory: shouldUse,
            historyAnalysis: shouldUse ? historyAnalysis : undefined,
            reason: shouldUse ? 'Analysis history valid' : 'Issue activity changed',
        };
    }

    async saveToHistory(
        owner: string,
        repo: string,
        issues: Issue[],
        analyses: Map<number, AnalysisResult>
    ): Promise<void> {
        await this.init();
        const key = `${owner}/${repo}`;

        const metadata: HistoryMetadata = {
            owner,
            repo,
            lastFetched: Date.now(),
            issueCount: issues.length,
            issuesActivity: this.calculateIssueActivityRate(issues),
            commentsActivity: this.calculateCommentActivityRate(issues),
        };

        // Convert Map to plain object for storage
        const analysesObj: Record<number, AnalysisResult> = {};
        analyses.forEach((value, key) => {
            analysesObj[key] = value;
        });

        const historyEntry: HistoryEntry = {
            key,
            issues,
            analyses: analysesObj as unknown as Map<number, AnalysisResult>,
            metadata,
            fetchedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const store = this.getStore('readwrite');
            const request = store.put(historyEntry);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async updateHistoryAnalyses(
        owner: string,
        repo: string,
        analyses: Map<number, AnalysisResult>
    ): Promise<void> {
        await this.init();
        const key = `${owner}/${repo}`;

        const entry = await this.getHistoryEntry(owner, repo);
        if (!entry.valid || !entry.data) {
            throw new Error('Cannot update analyses: repository not in history');
        }

        // Merge new analyses with existing
        const mergedAnalyses = new Map(entry.data.analyses);
        analyses.forEach((value, key) => {
            mergedAnalyses.set(key, value);
        });

        await this.saveToHistory(
            owner,
            repo,
            entry.data.issues,
            mergedAnalyses
        );
    }

    async getAllHistory(): Promise<Array<{ key: string; metadata: HistoryMetadata; fetchedAt: number }>> {
        await this.init();
        
        return new Promise((resolve, reject) => {
            const store = this.getStore('readonly');
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const results = request.result as HistoryEntry[];
                resolve(
                    results.map(r => ({
                        key: r.key,
                        metadata: r.metadata,
                        fetchedAt: r.fetchedAt,
                    }))
                );
            };
        });
    }

    async deleteFromHistory(owner: string, repo: string): Promise<void> {
        await this.init();
        const key = `${owner}/${repo}`;

        return new Promise((resolve, reject) => {
            const store = this.getStore('readwrite');
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async clearAllHistory(): Promise<void> {
        await this.init();

        return new Promise((resolve, reject) => {
            const store = this.getStore('readwrite');
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

export const historyService = new HistoryService();
