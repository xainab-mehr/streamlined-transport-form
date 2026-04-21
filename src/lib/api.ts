const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  'https://cryofuture-chloe-ai-hyb0bybagjh9dva8.westus-01.azurewebsites.net';

export async function apiPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
