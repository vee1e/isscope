import { CONFIG } from '../constants';

export interface OpenRouterOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export async function callOpenRouter(
  prompt: string,
  userMessage: string,
  apiKey: string,
  model: string = CONFIG.DEFAULT_MODEL,
  baseUrl: string = CONFIG.OPENROUTER_API_BASE,
): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenRouter API Key is missing. Please configure it.');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Isscope',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export { CONFIG };
