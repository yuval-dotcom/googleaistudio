import { runGenerate, runGenerateStream } from '../../api/gemini.js';

export async function generateText(apiKey, { prompt, systemInstruction }) {
  return runGenerate(apiKey, { prompt, systemInstruction });
}

export async function* generateTextStream(apiKey, { prompt, systemInstruction }) {
  for await (const chunk of runGenerateStream(apiKey, { prompt, systemInstruction })) {
    yield chunk;
  }
}

