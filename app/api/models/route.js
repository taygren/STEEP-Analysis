/**
 * GET /api/models
 * Returns the curated catalog of models the app supports, filtered to providers
 * whose API key is actually configured.
 *
 * Cerebras model ids are prefixed with "cerebras/" so the analyze route can
 * tell which provider to dispatch to. Groq ids are passed through unchanged.
 */
const GROQ_MODELS = [
  { name: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B',        note: 'Recommended — best quality, fast on Groq',  provider: 'groq' },
  { name: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B Instant', note: 'Fastest — separate daily quota from 70B',   provider: 'groq' },
  { name: 'llama3-8b-8192',          label: 'Llama 3 8B',           note: 'Solid baseline, 8k context',                provider: 'groq' },
  { name: 'mixtral-8x7b-32768',      label: 'Mixtral 8×7B',         note: 'Strong reasoning, 32k context',             provider: 'groq' },
  { name: 'gemma2-9b-it',            label: 'Gemma 2 9B',           note: 'Google model, good instruction following',  provider: 'groq' },
];

const CEREBRAS_MODELS = [
  { name: 'cerebras/qwen-3-235b-a22b-instruct-2507', label: 'Qwen 3 235B Instruct (Cerebras)', note: 'Top-tier reasoning — separate daily quota from Groq', provider: 'cerebras' },
  { name: 'cerebras/llama3.1-8b',                    label: 'Llama 3.1 8B (Cerebras)',         note: 'Fastest Cerebras option — good for quick tests',      provider: 'cerebras' },
];

export async function GET() {
  const models = [];
  if (process.env.GROQ_API_KEY)     models.push(...GROQ_MODELS);
  if (process.env.CEREBRAS_API_KEY) models.push(...CEREBRAS_MODELS);
  return Response.json({ models });
}
