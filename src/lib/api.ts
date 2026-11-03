const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export type ExtractionResult = {
  document_name: string;
  extraction_mode: string;
  review_required: boolean;
  extracted_entities: Array<{ text: string; entity_type: string; confidence: number; evidence: string }>;
  source_notes: string[];
  warnings: string[];
};

export async function extractDocument(file: File): Promise<ExtractionResult> {
  if (!API_BASE) throw new Error("The research API is not configured. Set VITE_API_BASE_URL to enable server-side document extraction.");
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(API_BASE + "/api/v1/extract", { method: "POST", body: form });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Document extraction failed.");
  }
  return response.json() as Promise<ExtractionResult>;
}

export async function checkApi(): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const response = await fetch(API_BASE + "/health", { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch { return false; }
}