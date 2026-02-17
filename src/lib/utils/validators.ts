import { REPO_REGEX } from '../constants';

export function validateRepoInput(input: string): { valid: boolean; error?: string } {
    const trimmed = input.trim();

    if (!trimmed) {
        return { valid: false, error: 'Repository path is required' };
    }

    // Handle full GitHub URLs
    const urlMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/);
    if (urlMatch) {
        const path = urlMatch[1].replace(/\.git$/, '');
        if (REPO_REGEX.test(path)) {
            return { valid: true };
        }
    }

    if (!REPO_REGEX.test(trimmed)) {
        return { valid: false, error: 'Use format: owner/repo' };
    }

    return { valid: true };
}

export function parseRepoInput(input: string): { owner: string; repo: string } {
    const trimmed = input.trim();

    // Handle full GitHub URLs
    const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (urlMatch) {
        return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
    }

    const [owner, repo] = trimmed.split('/');
    return { owner, repo };
}
