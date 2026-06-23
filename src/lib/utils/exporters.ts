import type { RankedIssue } from '../types';
import { statusLabel, complexityLabel, friendlinessLabel, progressLabel } from './formatters';

export function exportToMarkdown(issues: RankedIssue[], repoName: string): string {
  const lines: string[] = [
    `# Isscope Report — ${repoName}`,
    ``,
    `> Generated on ${new Date().toLocaleString()}`,
    `> Total issues analyzed: ${issues.length}`,
    ``,
    `---`,
    ``,
    `## Summary Table`,
    ``,
    `| Rank | # | Title | Score | Status | Complexity |`,
    `|------|---|-------|-------|--------|------------|`,
  ];

  issues.forEach((issue, i) => {
    const analysis = issue.analysis;
    lines.push(
      `| ${i + 1} | #${issue.number} | ${issue.title.slice(0, 50)} | ${issue.score}/100 | ${analysis ? statusLabel(analysis.status) : '—'} | ${analysis ? complexityLabel(analysis.complexity) : '—'} |`,
    );
  });

  lines.push('', '---', '');

  for (const issue of issues) {
    const a = issue.analysis;
    lines.push(
      `## #${issue.number} — ${issue.title}`,
      ``,
      `- **Doability Score**: ${issue.score}/100`,
      `- **URL**: ${issue.html_url}`,
      `- **Author**: @${issue.user.login}`,
      `- **Labels**: ${issue.labels.map((l) => l.name).join(', ') || 'none'}`,
      `- **Created**: ${issue.created_at}`,
      ``,
    );

    if (a) {
      lines.push(
        `### Analysis`,
        ``,
        `- **Status**: ${statusLabel(a.status)}`,
        `- **Progress**: ${progressLabel(a.progress_estimate)}`,
        `- **Complexity**: ${complexityLabel(a.complexity)} (${a.complexity}/5)`,
        `- **Newcomer Friendliness**: ${friendlinessLabel(a.newcomer_friendliness)} (${a.newcomer_friendliness}/5)`,
        `- **Skills Required**: ${a.skills_required.join(', ') || 'none'}`,
        `- **Actionable Code Change**: ${a.is_actionable_code_change ? 'Yes' : 'No'}`,
        a.not_mergeable_reason ? `- **Merge Blocker**: ${a.not_mergeable_reason}` : '',
        ``,
        `> ${a.summary}`,
        ``,
        `**Notes**: ${a.analysis_notes}`,
        ``,
      );
    }

    lines.push('---', '');
  }

  return lines.filter(Boolean).join('\n');
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(issues: RankedIssue[], repoName: string): string {
  const header = 'Rank,Issue #,Title,Score,Status,Complexity,Newcomer Friendliness,Skills Required,URL';
  const rows = issues.map((issue, i) => {
    const a = issue.analysis;
    const title = `"${issue.title.replace(/"/g, '""')}"`;
    const status = a ? statusLabel(a.status) : '—';
    const complexity = a ? complexityLabel(a.complexity) : '—';
    const friendliness = a ? friendlinessLabel(a.newcomer_friendliness) : '—';
    const skills = a ? a.skills_required.join('; ') : '';
    return [i + 1, `#${issue.number}`, title, issue.score, status, complexity, friendliness, `"${skills}"`, issue.html_url].join(',');
  });
  return [header, ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
