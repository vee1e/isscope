import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callLocal, resolveLocalConfig, isLocalConfigured } from './local';

describe('Local LLM client', () => {
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

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('callLocal', () => {
    it('POSTs to <endpoint>/chat/completions with the model and messages', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          choices: [{ message: { content: 'hi' } }],
        }),
      );

      const out = await callLocal('system', 'user', {
        endpoint: 'http://localhost:11434/v1',
        model: 'llama3.2',
      });

      expect(out).toBe('hi');
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:11434/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      const body = JSON.parse(options.body);
      expect(body.model).toBe('llama3.2');
      expect(body.messages).toEqual([
        { role: 'system', content: 'system' },
        { role: 'user', content: 'user' },
      ]);
      // Local providers should not get the strict json_object response_format
      // (some local backends reject it).
      expect(body.response_format).toBeUndefined();
    });

    it('strips trailing slashes from the endpoint', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(200, { choices: [{ message: { content: 'x' } }] }),
      );

      await callLocal('s', 'u', { endpoint: 'http://localhost:1234/v1///', model: 'm' });
      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:1234/v1/chat/completions');
    });

    it('sends an Authorization header only when an API key is configured', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(200, { choices: [{ message: { content: 'x' } }] }),
      );

      await callLocal('s', 'u', {
        endpoint: 'http://localhost:1234/v1',
        model: 'm',
      });
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBeUndefined();

      mockFetch.mockClear();
      mockFetch.mockResolvedValue(
        createMockResponse(200, { choices: [{ message: { content: 'x' } }] }),
      );

      await callLocal('s', 'u', {
        endpoint: 'http://localhost:1234/v1',
        model: 'm',
        apiKey: 'lm-studio',
      });
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer lm-studio');
    });

    it('throws RATE_LIMITED on 429', async () => {
      mockFetch.mockResolvedValue(createMockResponse(429, {}));

      await expect(callLocal('s', 'u', { endpoint: 'http://x', model: 'm' })).rejects.toThrow(
        'RATE_LIMITED',
      );
    });

    it('throws a descriptive error on non-ok responses', async () => {
      mockFetch.mockResolvedValue(createMockResponse(503, 'service down'));

      await expect(callLocal('s', 'u', { endpoint: 'http://x', model: 'm' })).rejects.toThrow(
        /Local LLM error 503/,
      );
    });
  });

  describe('resolveLocalConfig', () => {
    it('falls back to defaults when no override is given', () => {
      const cfg = resolveLocalConfig();
      expect(cfg.endpoint).toBeTruthy();
      expect(cfg.model).toBeTruthy();
      expect(cfg.apiKey).toBeUndefined();
    });

    it('uses override values when provided', () => {
      const cfg = resolveLocalConfig({
        endpoint: 'http://example.local:9000/v1',
        model: 'mistral',
        apiKey: 'abc',
      });
      expect(cfg.endpoint).toBe('http://example.local:9000/v1');
      expect(cfg.model).toBe('mistral');
      expect(cfg.apiKey).toBe('abc');
    });

    it('ignores blank/whitespace override values and keeps the default', () => {
      const cfg = resolveLocalConfig({ endpoint: '   ', model: '' });
      expect(cfg.endpoint).toBeTruthy();
      expect(cfg.model).toBeTruthy();
    });
  });

  describe('isLocalConfigured', () => {
    it('returns true when both endpoint and model are present', () => {
      expect(isLocalConfigured({ endpoint: 'http://x', model: 'm' })).toBe(true);
    });

    it('returns false when endpoint is empty', () => {
      expect(isLocalConfigured({ endpoint: '', model: 'm' })).toBe(false);
    });

    it('returns false when model is empty', () => {
      expect(isLocalConfigured({ endpoint: 'http://x', model: '' })).toBe(false);
    });
  });
});
