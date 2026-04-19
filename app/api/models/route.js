/**
 * GET /api/models
 * Returns the curated list of Groq-hosted models the app supports.
 */
const GROQ_MODELS = [
  { name: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B',       note: 'Recommended — best quality, fast on Groq' },
  { name: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant', note: 'Fastest — good for quick tests' },
  { name: 'llama3-8b-8192',          label: 'Llama 3 8B',           note: 'Solid baseline, 8k context' },
  { name: 'mixtral-8x7b-32768',      label: 'Mixtral 8×7B',         note: 'Strong reasoning, 32k context' },
  { name: 'gemma2-9b-it',            label: 'Gemma 2 9B',           note: 'Google model, good instruction following' },
];

export async function GET() {
  return Response.json({ models: GROQ_MODELS });
}
