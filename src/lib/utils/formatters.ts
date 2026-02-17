// ── Formatters ────────────────────────────────────

export function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatTimeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    const intervals = [
        { label: 'y', seconds: 31536000 },
        { label: 'mo', seconds: 2592000 },
        { label: 'd', seconds: 86400 },
        { label: 'h', seconds: 3600 },
        { label: 'm', seconds: 60 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) return `${count}${interval.label} ago`;
    }
    return 'just now';
}

export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + '…';
}

export function complexityLabel(n: number): string {
    const labels = ['—', 'Trivial', 'Simple', 'Moderate', 'Complex', 'Major Rewrite'];
    return labels[n] || '—';
}

export function friendlinessLabel(n: number): string {
    const labels = ['—', 'Expert Only', 'Advanced', 'Intermediate', 'Beginner Friendly', 'Great First Issue'];
    return labels[n] || '—';
}

export function progressLabel(p: string): string {
    const map: Record<string, string> = {
        not_started: 'Not Started',
        early: 'Early Stage',
        midway: 'In Progress',
        nearly_done: 'Nearly Done',
    };
    return map[p] || p;
}

export function statusLabel(s: string): string {
    const map: Record<string, string> = {
        active: 'Active',
        stale: 'Stale',
        discussion: 'Discussion',
        external: 'External Dep',
        wontfix: "Won't Fix",
    };
    return map[s] || s;
}
