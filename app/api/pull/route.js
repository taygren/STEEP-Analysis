/**
 * POST /api/pull
 * Not applicable when using Groq (cloud-hosted models).
 */
export async function POST() {
  return Response.json(
    { error: 'Model pulling is not supported when using the Groq provider. Models are cloud-hosted.' },
    { status: 410 },
  );
}
