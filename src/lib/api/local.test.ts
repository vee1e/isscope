import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  callLocal,
  resolveLocalConfig,
  isLocalConfigured,
  testLocalConnection,
  detectLocalServer,
  corsHelpText,
} from './local';

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

    it('wraps network errors (e.g. CORS rejections) with a helpful, endpoint-specific message', async () => {
      const networkError = new TypeError('NetworkError when attempting to fetch resource.');
      mockFetch.mockRejectedValue(networkError);

      await expect(
        callLocal('s', 'u', { endpoint: 'http://127.0.0.1:1234/v1', model: 'm' }),
      ).rejects.toThrow(/Could not reach the local LLM server at http:\/\/127\.0\.0\.1:1234\/v1/);

      await expect(
        callLocal('s', 'u', { endpoint: 'http://127.0.0.1:1234/v1', model: 'm' }),
      ).rejects.toThrow(/LMStudio/);

      mockFetch.mockClear();
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(
        callLocal('s', 'u', { endpoint: 'http://localhost:11434/v1', model: 'm' }),
      ).rejects.toThrow(/Ollama/);
    });
  });

  describe('testLocalConnection', () => {
    it('returns ok with the list of model ids on success', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(200, {
          data: [{ id: 'llama3.2' }, { id: 'qwen2.5-coder:7b' }, { id: 42 }],
        }),
      );

      const result = await testLocalConnection({
        endpoint: 'http://localhost:11434/v1',
        model: 'llama3.2',
      });

      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:11434/v1/models');
      expect(mockFetch.mock.calls[0][1].method).toBe('GET');
      expect(result.ok).toBe(true);
      expect(result.models).toEqual(['llama3.2', 'qwen2.5-coder:7b']);
    });

    it('returns ok with empty model list when response has no data array', async () => {
      mockFetch.mockResolvedValue(createMockResponse(200, {}));

      const result = await testLocalConnection({
        endpoint: 'http://localhost:1234/v1',
        model: 'm',
      });

      expect(result.ok).toBe(true);
      expect(result.models).toEqual([]);
    });

    it('returns a CORS-aware error when fetch itself rejects', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await testLocalConnection({
        endpoint: 'http://127.0.0.1:1234/v1',
        model: 'm',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/Could not reach the local LLM server/);
      expect(result.error).toMatch(/LMStudio/);
      expect(result.models).toBeUndefined();
    });

    it('returns a status error when the server responds with non-OK', async () => {
      mockFetch.mockResolvedValue(createMockResponse(404, 'not here'));

      const result = await testLocalConnection({
        endpoint: 'http://localhost:11434/v1',
        model: 'm',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/404/);
    });

    it('returns a parse error when the server returns non-JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        // Simulate a real browser response.json() that throws on invalid JSON
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
        text: async () => '<html>not json</html>',
      });

      const result = await testLocalConnection({
        endpoint: 'http://localhost:11434/v1',
        model: 'm',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/non-JSON/);
    });

    it('sends the Authorization header when an API key is configured', async () => {
      mockFetch.mockResolvedValue(createMockResponse(200, { data: [] }));

      await testLocalConnection({
        endpoint: 'http://localhost:1234/v1',
        model: 'm',
        apiKey: 'lm-studio',
      });
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer lm-studio');
    });
  });

  describe('detectLocalServer', () => {
    it('detects LMStudio by port 1234', () => {
      expect(detectLocalServer('http://127.0.0.1:1234/v1')).toBe('lmstudio');
      expect(detectLocalServer('http://localhost:1234/v1')).toBe('lmstudio');
    });

    it('detects Ollama by port 11434', () => {
      expect(detectLocalServer('http://127.0.0.1:11434/v1')).toBe('ollama');
      expect(detectLocalServer('http://localhost:11434')).toBe('ollama');
    });

    it('falls back to "other" for unknown ports', () => {
      expect(detectLocalServer('http://example.com:9000/v1')).toBe('other');
    });
  });

  describe('corsHelpText', () => {
    it('mentions LMStudio CORS setting for port 1234', () => {
      expect(corsHelpText('http://127.0.0.1:1234/v1')).toMatch(/LMStudio/);
      expect(corsHelpText('http://127.0.0.1:1234/v1')).toMatch(/CORS/);
    });

    it('mentions Ollama CORS guidance for port 11434', () => {
      expect(corsHelpText('http://localhost:11434/v1')).toMatch(/Ollama/);
      expect(corsHelpText('http://localhost:11434/v1')).toMatch(/OLLAMA_ORIGINS/);
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
