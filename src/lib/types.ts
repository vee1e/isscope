import { z } from 'zod/v4';

// ── GitHub Types ──────────────────────────────────

export interface GitHubUser {
    login: string;
    avatar_url: string;
    html_url: string;
}

export interface Label {
    name: string;
    color: string;
    description?: string;
}

export interface Comment {
    id: number;
    user: GitHubUser;
    body: string;
    created_at: string;
    updated_at: string;
}

export interface TimelineEvent {
    event: string;
    created_at: string;
    actor?: GitHubUser;
    source?: {
        type: string;
        issue?: {
            number: number;
            pull_request?: object;
        };
    };
    commit_id?: string;
    label?: Label;
}

export interface Issue {
    number: number;
    title: string;
    body: string | null;
    user: GitHubUser;
    labels: Label[];
    assignees: GitHubUser[];
    comments_count: number;
    created_at: string;
    updated_at: string;
    html_url: string;
    state: string;
    comments?: Comment[];
    timeline?: TimelineEvent[];
    pull_request?: object;
}

// ── AI Analysis Types ─────────────────────────────

export type IssueStatus = 'active' | 'stale' | 'discussion' | 'external' | 'wontfix';
export type ProgressEstimate = 'not_started' | 'early' | 'midway' | 'nearly_done';

export const AnalysisResultSchema = z.object({
    summary: z.string(),
    status: z.enum(['active', 'stale', 'discussion', 'external', 'wontfix']),
    progress_estimate: z.enum(['not_started', 'early', 'midway', 'nearly_done']),
    is_actionable_code_change: z.boolean(),
    not_mergeable_reason: z.string().nullable(),
    complexity: z.number().min(1).max(5),
    skills_required: z.array(z.string()),
    newcomer_friendliness: z.number().min(1).max(5),
    doability_score: z.number().min(1).max(100),
    analysis_notes: z.string(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ── UI State Types ────────────────────────────────

export type AppScreen = 'input' | 'fetching' | 'analyzing' | 'report';

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
    timestamp: string;
    message: string;
    type: LogType;
}

export interface FetchProgress {
    phase: 'fetching' | 'analyzing';
    current: number;
    total: number;
}

export interface RankedIssue extends Issue {
    analysis?: AnalysisResult;
    score: number;
}

// ── Utility ───────────────────────────────────────

export function getScoreClass(score: number): string {
    if (score >= 75) return 'score-high';
    if (score >= 40) return 'score-medium';
    if (score > 0) return 'score-low';
    return 'score-none';
}

export function getScoreLabel(score: number): string {
    if (score >= 75) return 'High';
    if (score >= 40) return 'Medium';
    if (score > 0) return 'Low';
    return '—';
}
