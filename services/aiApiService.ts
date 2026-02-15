/**
 * Client-side AI API. Calls our backend /api/ai so the Gemini key never leaves the server.
 */

const API_AI = '/api/ai';

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  lang?: 'en' | 'he';
}

export interface GenerateStreamOptions extends GenerateOptions {
  onChunk: (text: string) => void;
}

export async function generate(options: GenerateOptions): Promise<{ text: string }> {
  const res = await fetch(API_AI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: options.prompt,
      systemInstruction: options.systemInstruction,
      stream: false,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `API error ${res.status}`);
  }
  return res.json();
}

export async function generateStream(
  options: GenerateStreamOptions
): Promise<void> {
  const { onChunk, ...rest } = options;
  const res = await fetch(API_AI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...rest, stream: true }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `API error ${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (typeof parsed.text === 'string') onChunk(parsed.text);
        } catch {
          // skip invalid JSON
        }
      }
    }
  }
}
