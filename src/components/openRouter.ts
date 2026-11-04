const STORAGE_KEY = "herabrium-openrouter-config-v1";
export type OpenRouterConfig = { apiKey: string; model: string };
export function getOpenRouterConfig(): OpenRouterConfig | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return value && typeof value.apiKey === "string" && typeof value.model === "string" ? value : null;
  } catch { return null; }
}
export function saveOpenRouterConfig(config: OpenRouterConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
export function clearOpenRouterConfig() { localStorage.removeItem(STORAGE_KEY); }
export async function requestOpenRouterAnswer(query: string, section: string, context: unknown) {
  const config = getOpenRouterConfig();
  if (!config?.apiKey) return null;
  const response = await fetch("/api/v1/openrouter/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "X-OpenRouter-Key": config.apiKey },
    body: JSON.stringify({ query, section, context, model: config.model }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "OpenRouter could not generate a research response.");
  return data as { answer: string; model: string; provider: string; review_required: boolean };
}
