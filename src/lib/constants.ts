export const CONFIG = {
  GITHUB_API_BASE: 'https://api.github.com',
  OPENROUTER_API_BASE: 'https://openrouter.ai/api/v1',
  DEFAULT_MODEL: import.meta.env.VITE_MODEL_NAME || 'arcee-ai/trinity-large-preview:free',
  MAX_CONCURRENT_REQUESTS: 5,
  RATE_LIMIT_BUFFER: 100,
  DEFAULT_PAGE_SIZE: 100,
  DEFAULT_MAX_ISSUES: 200,
  MIN_MAX_ISSUES: 10,
  MAX_MAX_ISSUES: 1000,
} as const;

export const REPO_REGEX = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

export const ANALYSIS_PROMPT = `You are an expert open-source contributor analyst. Analyze the given GitHub issue and produce a JSON assessment.

Evaluate:
1. **Summary**: A concise 1-2 sentence summary of the issue
2. **Status**: One of: active, stale, discussion, external, wontfix
   - active: Needs code changes, is being worked on or ready
   - stale: No activity for 6+ months
   - discussion: Feature request or discussion, not actionable
   - external: Depends on external factors/upstream
   - wontfix: Maintainer indicated won't fix
3. **Progress Estimate**: not_started, early, midway, nearly_done
4. **Is Actionable Code Change**: true if it requires concrete code changes
5. **Not Mergeable Reason**: Why it might not be mergeable, or null
6. **Complexity**: 1 (trivial) to 5 (major rewrite)
7. **Skills Required**: Array of skill tags (e.g., ["rust", "cli", "testing"])
8. **Newcomer Friendliness**: 1 (expert only) to 5 (great first issue)
9. **Doability Score**: 1 to 100 overall score combining all factors
10. **Analysis Notes**: Brief explanation of your reasoning

Respond ONLY with valid JSON matching this exact schema:
{
  "summary": "string",
  "status": "active|stale|discussion|external|wontfix",
  "progress_estimate": "not_started|early|midway|nearly_done",
  "is_actionable_code_change": boolean,
  "not_mergeable_reason": "string|null",
  "complexity": number,
  "skills_required": ["string"],
  "newcomer_friendliness": number,
  "doability_score": number,
  "analysis_notes": "string"
}`;
