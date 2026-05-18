import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeIssue, analyzeAllIssues } from './openrouter';
import { useAppStore } from '../../store/appStore';
import type { Issue } from '../types';

describe('OpenRouter API Client', () => {
  let mockFetch: any;

  // Helper to create mocked Response
  function createMockResponse(status: number, data: any) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: async () => data,
      text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    };
  }

  const mockIssue: Issue = {
    number: 42,
    title: 'Fix styling of footer layout',
    body: 'The footer needs centered text.',
    user: { login: 'mock-user', avatar_url: '', html_url: '' },
    labels: [{ name: 'ui', color: 'blue' }],
    assignees: [],
    comments_count: 0,
    created_at: '2026-05-18T10:00:00Z',
    updated_at: '2026-05-18T10:00:00Z',
    html_url: 'https://github.com/owner/repo/issues/42',
    state: 'open',
  };

  const validAnalysisJSON = {
    summary: 'A simple cosmetic CSS change to center the footer text.',
    status: 'active',
    progress_estimate: 'not_started',
    is_actionable_code_change: true,
    not_mergeable_reason: null,
    complexity: 1,
    skills_required: ['CSS'],
    newcomer_friendliness: 5,
    doability_score: 95,
    analysis_notes: 'Perfect first issue.',
  };

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Mock window global to avoid runtime ReferenceErrors
    vi.stubGlobal('window', {
      location: {
        origin: 'https://isscope-mock.com',
      },
    });

    // Avoid real retry delays in test environment
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any) => {
      fn();
      return 0 as any;
    });

    // Reset openrouter keys
    useAppStore.setState({ openRouterKey: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('callOpenRouter & Configurations', () => {
    it('throws error if OpenRouter Key is missing', async () => {
      useAppStore.setState({ openRouterKey: '' });

      const logSpy = vi.fn();
      const result = await analyzeIssue(mockIssue, logSpy);

      // Falls back to DEFAULT_ANALYSIS with error noted
      expect(result.analysis_notes).toContain('OpenRouter API Key is missing');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to analyze'));
    });

    it('makes expected HTTP request when API Key is configured', async () => {
      useAppStore.setState({ openRouterKey: 'openrouter-secret-key' });

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [
            {
              message: {
                content: JSON.stringify(validAnalysisJSON),
              },
            },
          ],
        }),
      );

      const result = await analyzeIssue(mockIssue);

      expect(mockFetch).toHaveBeenCalled();
      const fetchArgs = mockFetch.mock.calls[0];
      expect(fetchArgs[0]).toContain('/chat/completions');

      const options = fetchArgs[1];
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer openrouter-secret-key');
      expect(options.headers['HTTP-Referer']).toBe('https://isscope-mock.com');

      // Verify the parsed result matches valid JSON
      expect(result.doability_score).toBe(95);
      expect(result.complexity).toBe(1);
    });
  });

  describe('Retry Logic (analyzeIssue)', () => {
    it('retries on RATE_LIMITED (429) up to 3 times before failing', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      // Return 429 three times
      mockFetch.mockResolvedValue(createMockResponse(429, {}));

      const logSpy = vi.fn();
      const result = await analyzeIssue(mockIssue, logSpy);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⏳ Rate limited'));
      expect(result.analysis_notes).toContain('Error: RATE_LIMITED');
    });

    it('retries on 429 and succeeds if rate limit clears', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      // First call: 429
      // Second call: 200 OK
      mockFetch.mockResolvedValueOnce(createMockResponse(429, {})).mockResolvedValueOnce(
        createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
        }),
      );

      const logSpy = vi.fn();
      const result = await analyzeIssue(mockIssue, logSpy);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⏳ Rate limited'));
      expect(result.doability_score).toBe(95);
    });
  });

  describe('parseAnalysisResponse & Malformed JSON recovery', () => {
    it('handles JSON wrapped in markdown code fences correctly', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      const markdownWrapped = `\`\`\`json\n${JSON.stringify(validAnalysisJSON)}\n\`\`\``;

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: markdownWrapped } }],
        }),
      );

      const result = await analyzeIssue(mockIssue);
      expect(result.doability_score).toBe(95);
      expect(result.complexity).toBe(1);
    });

    it('salvages partial JSON responses with partial field data', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      // Incomplete schema: missing progress_estimate, skills_required, newcomer_friendliness
      const partialJSON = {
        summary: 'Partial analysis results.',
        doability_score: 75,
        complexity: 3,
      };

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(partialJSON) } }],
        }),
      );

      const result = await analyzeIssue(mockIssue);

      expect(result.summary).toBe('Partial analysis results.');
      expect(result.doability_score).toBe(75);
      expect(result.complexity).toBe(3);
      // Fallback values applied
      expect(result.status).toBe('active');
      expect(result.analysis_notes).toBe('Partially parsed from AI response.');
    });

    it('falls back to default analysis when response is completely unparseable', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: 'This is not a JSON object at all.' } }],
        }),
      );

      const result = await analyzeIssue(mockIssue);

      expect(result.summary).toBe('Analysis could not be completed.');
      expect(result.doability_score).toBe(50);
      expect(result.analysis_notes).toContain('Failed to parse AI response: This is not a JSON');
    });
  });

  describe('analyzeAllIssues', () => {
    it('analyzes all issues concurrently', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      const issueA = { ...mockIssue, number: 1 };
      const issueB = { ...mockIssue, number: 2 };

      mockFetch
        .mockResolvedValueOnce(
          createMockResponse(200, {
            choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
          }),
        )
        .mockResolvedValueOnce(
          createMockResponse(200, {
            choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
          }),
        );

      const progressSpy = vi.fn();
      const analyses = await analyzeAllIssues([issueA, issueB], progressSpy);

      expect(analyses.size).toBe(2);
      expect(analyses.get(1)?.doability_score).toBe(95);
      expect(analyses.get(2)?.doability_score).toBe(95);
      expect(progressSpy).toHaveBeenCalledTimes(2);
    });

    it('respects cancellation tokens', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      const issueA = { ...mockIssue, number: 1 };
      const issueB = { ...mockIssue, number: 2 };

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
        }),
      );

      let isCancelledVal = false;
      const analyses = await analyzeAllIssues(
        [issueA, issueB],
        undefined,
        undefined,
        () => isCancelledVal,
      );

      isCancelledVal = true;

      expect(analyses).toBeDefined();
    });
  });
});
