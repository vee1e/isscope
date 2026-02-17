import { CONFIG, ANALYSIS_PROMPT } from '../constants';
import { AnalysisResultSchema, type AnalysisResult, type Issue } from '../types';

function formatIssueForAnalysis(issue: Issue): string {
    const parts = [
        `# Issue #${issue.number}: ${issue.title}`,
        ``,
        `**Author**: ${issue.user.login}`,
        `**Created**: ${issue.created_at}`,
        `**Updated**: ${issue.updated_at}`,
        `**Labels**: ${issue.labels.map((l) => l.name).join(', ') || 'none'}`,
        `**Assignees**: ${issue.assignees.map((a) => a.login).join(', ') || 'none'}`,
        `**Comment count**: ${issue.comments_count}`,
        ``,
        `## Body`,
        issue.body || '(no description)',
    ];

    if (issue.comments && issue.comments.length > 0) {
        parts.push('', '## Comments');
        for (const comment of issue.comments.slice(0, 15)) {
            parts.push(
                ``,
                `### @${comment.user.login} (${comment.created_at})`,
                comment.body.slice(0, 500)
            );
        }
    }

    if (issue.timeline && issue.timeline.length > 0) {
        parts.push('', '## Timeline Events');
        const relevant = issue.timeline
            .filter((e) => ['cross-referenced', 'referenced', 'labeled', 'assigned'].includes(e.event))
            .slice(0, 10);
        for (const event of relevant) {
            parts.push(`- ${event.event} by ${event.actor?.login || 'unknown'} at ${event.created_at}`);
        }
    }

    return parts.join('\n');
}

const DEFAULT_ANALYSIS: AnalysisResult = {
    summary: 'Analysis could not be completed.',
    status: 'active',
    progress_estimate: 'not_started',
    is_actionable_code_change: true,
    not_mergeable_reason: null,
    complexity: 3,
    skills_required: [],
    newcomer_friendliness: 3,
    doability_score: 50,
    analysis_notes: 'Fallback default — AI analysis failed or returned invalid data.',
};

import { useAppStore } from '../../store/appStore';

async function callOpenRouter(prompt: string, userMessage: string): Promise<string> {
    const apiKey = useAppStore.getState().openRouterKey;
    if (!apiKey) {
        throw new Error('OpenRouter API Key is missing. Please configure it.');
    }

    const response = await fetch(`${CONFIG.OPENROUTER_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Isscope',
        },
        body: JSON.stringify({
            model: CONFIG.DEFAULT_MODEL,
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.3,
            max_tokens: 1024,
            response_format: { type: 'json_object' },
        }),
    });

    if (response.status === 429) {
        throw new Error('RATE_LIMITED');
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

function parseAnalysisResponse(raw: string): AnalysisResult {
    try {
        // Try to extract JSON from the raw response
        let jsonStr = raw.trim();

        // Handle markdown code fences
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const parsed = JSON.parse(jsonStr);
        const validated = AnalysisResultSchema.parse(parsed);
        return validated;
    } catch {
        // Try to salvage partial data
        try {
            const parsed = JSON.parse(raw.trim());
            return {
                ...DEFAULT_ANALYSIS,
                summary: parsed.summary || DEFAULT_ANALYSIS.summary,
                doability_score: typeof parsed.doability_score === 'number' ? parsed.doability_score : DEFAULT_ANALYSIS.doability_score,
                complexity: typeof parsed.complexity === 'number' ? parsed.complexity : DEFAULT_ANALYSIS.complexity,
                skills_required: Array.isArray(parsed.skills_required) ? parsed.skills_required : [],
                status: parsed.status || DEFAULT_ANALYSIS.status,
                analysis_notes: parsed.analysis_notes || 'Partially parsed from AI response.',
            };
        } catch {
            return { ...DEFAULT_ANALYSIS, analysis_notes: 'Failed to parse AI response: ' + raw.slice(0, 200) };
        }
    }
}

export async function analyzeIssue(
    issue: Issue,
    onLog?: (message: string) => void
): Promise<AnalysisResult> {
    const formatted = formatIssueForAnalysis(issue);
    onLog?.(`Analyzing #${issue.number}: ${issue.title.slice(0, 60)}...`);

    let retries = 3;
    let backoff = 2000;

    while (retries > 0) {
        try {
            const raw = await callOpenRouter(ANALYSIS_PROMPT, formatted);
            const result = parseAnalysisResponse(raw);
            onLog?.(`✓ #${issue.number} analyzed — score: ${result.doability_score}/100, status: ${result.status}`);
            return result;
        } catch (err: any) {
            if (err.message === 'RATE_LIMITED' && retries > 1) {
                onLog?.(`⏳ Rate limited. Waiting ${backoff / 1000}s before retry...`);
                await new Promise((r) => setTimeout(r, backoff));
                backoff *= 2;
                retries--;
                continue;
            }
            onLog?.(`✗ Failed to analyze #${issue.number}: ${err.message}`);
            return { ...DEFAULT_ANALYSIS, analysis_notes: `Error: ${err.message}` };
        }
    }

    return DEFAULT_ANALYSIS;
}

export async function analyzeAllIssues(
    issues: Issue[],
    onProgress?: (current: number, total: number) => void,
    onLog?: (message: string) => void,
    isCancelled?: () => boolean
): Promise<Map<number, AnalysisResult>> {
    const analyses = new Map<number, AnalysisResult>();
    const CONCURRENCY = 15;
    let completed = 0;

    // Chunk array into batches or use a pool. A pool is better for speed.
    // Simple pool implementation:
    const queue = [...issues];
    const activeWorkers = new Set<Promise<void>>();

    const next = async (): Promise<void> => {
        if (isCancelled?.() || queue.length === 0) return;

        const issue = queue.shift();
        if (!issue) return;

        try {
            const result = await analyzeIssue(issue, onLog);
            if (!isCancelled?.()) {
                analyses.set(issue.number, result);
                completed++;
                onProgress?.(completed, issues.length);
            }
        } catch (e) {
            // Should be caught inside analyzeIssue, but just in case
            onLog?.(`Error in worker processing #${issue.number}: ${e}`);
        }

        // Process next
        return next();
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, issues.length) }, () => next());
    await Promise.all(workers);

    if (isCancelled?.()) {
        onLog?.('Analysis cancelled by user.');
    }

    return analyses;
}
