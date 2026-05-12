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

  return lines.filter((l) => l !== undefined).join('\n');
}

function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportToCSV(issues: RankedIssue[]): string {
  const headers = [
    'Rank',
    'Issue #',
    'Title',
    'Score',
    'Status',
    'Complexity',
    'Newcomer Friendliness',
    'Skills Required',
    'URL',
  ];

  const rows = issues.map((issue, i) => {
    const analysis = issue.analysis;

    return [
      i + 1,
      issue.number,
      issue.title,
      issue.score,
      analysis ? statusLabel(analysis.status) : '',
      analysis ? complexityLabel(analysis.complexity) : '',
      analysis ? friendlinessLabel(analysis.newcomer_friendliness) : '',
      analysis?.skills_required.join(', ') ?? '',
      issue.html_url,
    ];
  });

  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
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

export function downloadCSV(content: string, filename: string): void {
  const csvContent = content.startsWith('\uFEFF') ? content : `\uFEFF${content}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
