import { CONFIG } from '../constants';
import type { AnalysisResult, Issue, LocalProviderConfig } from '../types';

export interface LocalProviderOptions {
  endpoint: string;
  model: string;
  apiKey?: string;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '');
}

export function detectLocalServer(endpoint: string): 'lmstudio' | 'ollama' | 'other' {
  const url = endpoint.toLowerCase();
  if (url.includes(':1234')) return 'lmstudio';
  if (url.includes(':11434')) return 'ollama';
  return 'other';
}

export function corsHelpText(endpoint: string): string {
  const server = detectLocalServer(endpoint);
  if (server === 'lmstudio') {
    return 'In LMStudio, open the "Local Server" tab, click the ⚙ settings icon, and enable "CORS".';
  }
  if (server === 'ollama') {
    return 'In Ollama, set the OLLAMA_ORIGINS="*" environment variable before starting the server (or update to Ollama 0.1.14+, which allows browser origins by default).';
  }
  return 'Make sure the server allows browser (CORS) requests from this origin.';
}

function describeNetworkError(endpoint: string, original: string): string {
  return (
    `Could not reach the local LLM server at ${endpoint}. ` +
    `Verify the server is running and reachable. ` +
    `If the server is up, this is almost always a CORS issue — ${corsHelpText(endpoint)} ` +
    `(Original error: ${original})`
  );
}

export async function callLocal(
  prompt: string,
  userMessage: string,
  options: LocalProviderOptions,
): Promise<string> {
  const endpoint = normalizeEndpoint(options.endpoint);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(describeNetworkError(endpoint, message), { cause: err });
  }

  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local LLM error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export interface LocalConnectionTestResult {
  ok: boolean;
  models?: string[];
  error?: string;
}

export async function testLocalConnection(
  options: LocalProviderOptions,
): Promise<LocalConnectionTestResult> {
  const endpoint = normalizeEndpoint(options.endpoint);
  const headers: Record<string, string> = {};
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(`${endpoint}/models`, { method: 'GET', headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: describeNetworkError(endpoint, message) };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `Local server responded with ${response.status} ${response.statusText}.`,
    };
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    return {
      ok: false,
      error: 'Local server responded with non-JSON data — is this an OpenAI-compatible endpoint?',
    };
  }

  const models: string[] = Array.isArray(data?.data)
    ? data.data
        .map((m: any) => (typeof m?.id === 'string' ? m.id : null))
        .filter((m: string | null): m is string => m !== null)
    : [];

  return { ok: true, models };
}

export function resolveLocalConfig(override?: Partial<LocalProviderConfig>): LocalProviderConfig {
  return {
    endpoint: override?.endpoint?.trim() || CONFIG.DEFAULT_LOCAL_ENDPOINT,
    model: override?.model?.trim() || CONFIG.DEFAULT_LOCAL_MODEL,
    apiKey: override?.apiKey?.trim() || undefined,
  };
}

export function isLocalConfigured(config: LocalProviderConfig): boolean {
  return Boolean(config.endpoint) && Boolean(config.model);
}

export type { Issue, AnalysisResult };
