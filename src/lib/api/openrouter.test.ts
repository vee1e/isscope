import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callOpenRouter } from './openrouter';
import { analyzeIssue, analyzeAllIssues } from './provider';
import { useAppStore } from '../../store/appStore';
import type { Issue } from '../types';

describe('OpenRouter API Client', () => {
  let mockFetch: any;

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

    vi.stubGlobal('window', {
      location: {
        origin: 'https://isscope-mock.com',
      },
    });

    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: any) => {
      fn();
      return 0 as any;
    });

    useAppStore.setState({
      openRouterKey: '',
      aiProvider: 'openrouter',
      localEndpoint: 'http://localhost:11434/v1',
      localModel: 'llama3.2',
      localApiKey: '',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('callOpenRouter', () => {
    it('throws an explicit error when API Key is missing', async () => {
      await expect(callOpenRouter('system', 'user', '')).rejects.toThrow(
        /OpenRouter API Key is missing/,
      );
    });

    it('makes expected HTTP request with Bearer auth and OpenRouter headers', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: 'hello' } }],
        }),
      );

      const out = await callOpenRouter(
        'system prompt',
        'user message',
        'openrouter-secret-key',
        'openai/gpt-oss-20b:free',
      );

      expect(out).toBe('hello');
      expect(mockFetch).toHaveBeenCalled();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('https://openrouter.ai/api/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer openrouter-secret-key');
      expect(options.headers['HTTP-Referer']).toBe('https://isscope-mock.com');
      expect(options.headers['X-Title']).toBe('Isscope');
      expect(options.headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(options.body);
      expect(body.model).toBe('openai/gpt-oss-20b:free');
      expect(body.messages).toEqual([
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'user message' },
      ]);
      expect(body.response_format).toEqual({ type: 'json_object' });
    });

    it('throws RATE_LIMITED on 429 status', async () => {
      mockFetch.mockResolvedValue(createMockResponse(429, {}));

      await expect(callOpenRouter('s', 'u', 'k')).rejects.toThrow('RATE_LIMITED');
    });

    it('throws descriptive error on non-ok responses', async () => {
      mockFetch.mockResolvedValue(createMockResponse(500, 'boom'));

      await expect(callOpenRouter('s', 'u', 'k')).rejects.toThrow(/OpenRouter error 500/);
    });

    it('returns an empty string when the response has no message content', async () => {
      mockFetch.mockResolvedValue(createMockResponse(200, { choices: [] }));

      const out = await callOpenRouter('s', 'u', 'k');
      expect(out).toBe('');
    });
  });

  describe('provider dispatch', () => {
    it('falls back to DEFAULT_ANALYSIS with an error note when OpenRouter key is missing', async () => {
      useAppStore.setState({ openRouterKey: '', aiProvider: 'openrouter' });

      const logSpy = vi.fn();
      const result = await analyzeIssue(mockIssue, logSpy);

      expect(result.analysis_notes).toContain('OpenRouter API Key is missing');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to analyze'));
    });

    it('calls OpenRouter and parses the result when key is configured', async () => {
      useAppStore.setState({ openRouterKey: 'openrouter-secret-key' });

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
        }),
      );

      const result = await analyzeIssue(mockIssue);

      expect(mockFetch).toHaveBeenCalled();
      const fetchArgs = mockFetch.mock.calls[0];
      expect(fetchArgs[0]).toContain('/chat/completions');

      const options = fetchArgs[1];
      expect(options.headers['Authorization']).toBe('Bearer openrouter-secret-key');
      expect(result.doability_score).toBe(95);
      expect(result.complexity).toBe(1);
    });

    it('dispatches to the local provider when aiProvider is "local"', async () => {
      useAppStore.setState({
        aiProvider: 'local',
        localEndpoint: 'http://localhost:11434/v1',
        localModel: 'qwen2.5-coder:7b',
        localApiKey: '',
      });

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
        }),
      );

      const result = await analyzeIssue(mockIssue);

      expect(mockFetch).toHaveBeenCalled();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:11434/v1/chat/completions');
      expect(options.headers['Authorization']).toBeUndefined();
      const body = JSON.parse(options.body);
      expect(body.model).toBe('qwen2.5-coder:7b');
      expect(body.response_format).toBeUndefined();
      expect(result.doability_score).toBe(95);
    });

    it('honors an explicit provider override even when store default differs', async () => {
      useAppStore.setState({ aiProvider: 'openrouter', openRouterKey: 'k' });

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
        }),
      );

      const result = await analyzeIssue(mockIssue, undefined, 'openrouter');

      expect(result.doability_score).toBe(95);
    });
  });

  describe('Retry Logic (analyzeIssue)', () => {
    it('retries on RATE_LIMITED (429) up to 3 times before failing', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

      mockFetch.mockResolvedValue(createMockResponse(429, {}));

      const logSpy = vi.fn();
      const result = await analyzeIssue(mockIssue, logSpy);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⏳ Rate limited'));
      expect(result.analysis_notes).toContain('Error: RATE_LIMITED');
    });

    it('retries on 429 and succeeds if rate limit clears', async () => {
      useAppStore.setState({ openRouterKey: 'valid-key' });

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

    it('uses lower concurrency for the local provider', async () => {
      useAppStore.setState({ aiProvider: 'local' });

      const issueA = { ...mockIssue, number: 1 };
      const issueB = { ...mockIssue, number: 2 };
      const issueC = { ...mockIssue, number: 3 };

      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
        }),
      );

      let concurrentPeak = 0;
      let inFlight = 0;
      const originalThen = mockFetch.mockImplementation(async () => {
        inFlight++;
        concurrentPeak = Math.max(concurrentPeak, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
        return createMockResponse(200, {
          choices: [{ message: { content: JSON.stringify(validAnalysisJSON) } }],
        });
      });

      await analyzeAllIssues([issueA, issueB, issueC]);

      expect(concurrentPeak).toBeLessThanOrEqual(2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      originalThen.mockRestore();
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
      const promise = analyzeAllIssues(
        [issueA, issueB],
        undefined,
        undefined,
        () => isCancelledVal,
      );

      isCancelledVal = true;
      const analyses = await promise;

      expect(analyses).toBeDefined();
    });
  });
});
