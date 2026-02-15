/**
 * Server-only Gemini API. Never import this from client code.
 * API key is read from process.env.GEMINI_API_KEY.
 */
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.0-flash';

export async function runGenerate(apiKey, { prompt, systemInstruction }) {
  if (!apiKey?.trim()) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  });
  return { text: result?.text ?? '' };
}

export async function* runGenerateStream(apiKey, { prompt, systemInstruction }) {
  if (!apiKey?.trim()) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction ?? undefined,
      temperature: 0.7,
    },
  });
  for await (const chunk of stream) {
    if (chunk?.text) yield chunk.text;
  }
}
