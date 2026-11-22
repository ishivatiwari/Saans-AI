const cache = new Map<string, { expires: number; data: unknown }>();
export async function fetchJson(url: string) {
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) return cached.data;
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Upstream unavailable");
  const data: unknown = await response.json();
  if (cache.size >= 200) cache.delete(cache.keys().next().value!);
  cache.set(url, { expires: Date.now() + 10 * 60_000, data });
  return data;
}
