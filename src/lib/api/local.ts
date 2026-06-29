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

  const response = await fetch(`${endpoint}/chat/completions`, {
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
