import { useState } from "react";
import { requestOpenRouterAnswer } from "./openRouter";
import { ArrowUpRight, LoaderCircle, Search, ShieldCheck, Sparkles } from "lucide-react";

// Production API calls must stay on the same Vercel origin as the deployed
// FastAPI function. A stale VITE_API_BASE_URL (for example localhost) must
// never send production searches to a developer machine.
const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "")
  : "";

export type ResearchBridgeResult = {
  schema_version: string;
  query: string;
  section: string;
  section_name: string;
  generated_at: string;
  overview: string;
  taxon: null | {
    key: number;
    scientific_name: string;
    canonical_name?: string;
    rank?: string;
    taxonomic_status?: string;
    confidence?: number;
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    source_url?: string;
  };
  section_insights: Array<{ label: string; value: string }>;
  occurrence_summary: {
    total_indexed_records: number;
    returned_records: number;
    coordinate_backed_records: number;
    preserved_specimens: number;
  };
  occurrences: Array<{
    occurrence_id?: number;
    scientific_name?: string;
    country?: string;
    country_code?: string;
    state_province?: string;
    locality?: string;
    event_date?: string;
    year?: number;
    record_type?: string;
    dataset?: string;
    institution?: string;
    collection?: string;
    catalogue_number?: string;
    recorded_by?: string;
    latitude?: number;
    longitude?: number;
    record_url?: string;
    habitat_note?: string;
    field_note?: string;
  }>;
  related_knowledge: Array<{ id?: string; label?: string; description?: string; url?: string }>;
  literature_candidates: Array<{ title: string; authors: string[]; year?: number; publication?: string; doi?: string; url?: string; verification: string }>;
  sources: Array<{ name: string; url: string; purpose: string }>;
  warnings: string[];
  review_required: boolean;
  cached: boolean;
};

export async function requestResearch(query: string, section: string): Promise<ResearchBridgeResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 28000);
  let response: Response;
  try {
    response = await fetch(API_BASE + "/api/v1/research/query", {
      method: "POST",
      mode: "same-origin",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: query.trim(), section }),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("The research service took too long to respond. Please retry.");
    }
    throw new Error("Could not connect to the HERABRIUM research service on this website. Check your connection and retry.");
  } finally {
    window.clearTimeout(timeout);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail || payload?.message || "The research bridge could not complete this query.";
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return payload as ResearchBridgeResult;
}

export function ResearchBridgeResults({ result }: { result: ResearchBridgeResult }) {
  return <div className="hb-research-results">
    <div className="hb-research-overview">
      <span className="hb-research-eyebrow">{result.section_name} / LIVE RESEARCH</span>
      <p>{result.overview}</p>
      <small>{result.cached ? "Cached result" : "Retrieved live"} · {new Date(result.generated_at).toLocaleString()}</small>
    </div>
    {result.taxon && <div className="hb-research-taxonomy">
      <div><small>ACCEPTED TAXON</small><strong><i>{result.taxon.scientific_name}</i></strong></div>
      <div><small>RANK</small><strong>{result.taxon.rank || "Not supplied"}</strong></div>
      <div><small>FAMILY</small><strong>{result.taxon.family || "Not supplied"}</strong></div>
      <div><small>GENUS</small><strong>{result.taxon.genus || "Not supplied"}</strong></div>
      {result.taxon.source_url && <a href={result.taxon.source_url} target="_blank" rel="noreferrer">Taxonomy record <ArrowUpRight size={12}/></a>}
    </div>}
    {result.section_insights.length > 0 && <div className="hb-research-insights">{result.section_insights.map(item =>
      <div key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>
    )}</div>}
    <div className="hb-research-columns">
      <section><h5>Occurrence & specimen records <span>{result.occurrence_summary.total_indexed_records.toLocaleString()} indexed</span></h5>
        {result.occurrences.length ? result.occurrences.slice(0, 8).map((row, index) =>
          <article key={row.occurrence_id || index}>
            <strong><i>{row.scientific_name || result.taxon?.scientific_name || "Occurrence record"}</i></strong>
            <p>{[row.country, row.state_province, row.locality, row.event_date || row.year, row.record_type].filter(Boolean).join(" · ") || "Location or date not supplied"}</p>
            <small>{[row.dataset, row.institution, row.collection, row.catalogue_number, row.recorded_by].filter(Boolean).join(" · ")}</small>
            {row.record_url && <a href={row.record_url} target="_blank" rel="noreferrer">Open source record <ArrowUpRight size={11}/></a>}
          </article>
        ) : <p className="hb-research-muted">No occurrence records were returned for this name.</p>}
      </section>
      <section><h5>Related knowledge</h5>
        {result.related_knowledge.length ? result.related_knowledge.map((item, index) =>
          <article key={item.id || index}><strong>{item.label || item.id}</strong><p>{item.description || "No description supplied."}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open entity <ArrowUpRight size={11}/></a>}</article>
        ) : <p className="hb-research-muted">No related structured entities were found.</p>}
      </section>
    </div>
    {result.literature_candidates.length > 0 && <section className="hb-research-literature"><h5>Publication discovery candidates</h5>{result.literature_candidates.map((item, index) =>
      <article key={item.doi || item.url || index}><strong>{item.title}</strong><p>{[item.authors.join(", "), item.year, item.publication].filter(Boolean).join(" · ")}</p><small>{item.verification}</small>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Review publication <ArrowUpRight size={11}/></a>}</article>
    )}</section>}
    <div className="hb-research-sources"><strong>Sources used</strong>{result.sources.map(source => <a key={source.name} href={source.url} target="_blank" rel="noreferrer">{source.name} <ArrowUpRight size={11}/><small>{source.purpose}</small></a>)}</div>
    <div className="hb-research-warnings"><ShieldCheck size={14}/><div>{result.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div></div>
  </div>;
}

export default function ResearchBridgePanel({ section, title = "Search the wider research network", description = "Search public biodiversity, taxonomy and publication sources. Results are organised for this research environment and retain source links." }: { section: string; title?: string; description?: string }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchBridgeResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  async function search() {
    if (query.trim().length < 2) { setError("Enter at least two characters to search."); return; }
    setLoading(true); setError(""); setResult(null); setAiAnswer(""); setAiError("");
    try {
      const research = await requestResearch(query, section);
      setResult(research);
      setAiLoading(true);
      try {
        const ai = await requestOpenRouterAnswer(query.trim(), section, research);
        if (ai) setAiAnswer(ai.answer);
      } catch (err) { setAiError(err instanceof Error ? err.message : "AI interpretation is temporarily unavailable."); }
      finally { setAiLoading(false); }
    } catch (err) { setError(err instanceof Error ? err.message : "Research lookup failed. Please retry."); }
    finally { setLoading(false); }
  }
  return <section className="hb-research-panel">
    <style>{`
      .hb-research-panel{margin:18px 0 0;padding:16px;border:1px solid #315a43;border-radius:14px;background:linear-gradient(145deg,#0a1b13,#10251a);color:#dcebe2}
      .hb-research-panel *{box-sizing:border-box}.hb-research-title{font-size:10px;letter-spacing:.12em;color:#91cba7}.hb-research-panel h4{font-size:17px;margin:6px 0}.hb-research-panel>p{font-size:12px;color:#a6bdad;line-height:1.55;margin:0 0 12px}
      .hb-research-form{display:flex;gap:8px}.hb-research-form input{flex:1;min-width:0;background:#07140e;border:1px solid #426b52;border-radius:8px;padding:11px;color:#edf7ef;outline:none}.hb-research-form button{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #76a987;background:#214a32;color:#fff;border-radius:8px;padding:10px 14px;font-size:12px;cursor:pointer}.hb-research-form button:disabled{opacity:.55;cursor:wait}
      .hb-research-error{color:#ffc4a3;font-size:12px;margin-top:10px}.hb-research-results{margin-top:14px;border-top:1px solid #315a43;padding-top:14px}.hb-research-overview{padding:12px;border-radius:10px;background:#142c1e}.hb-research-eyebrow{font-size:9px;letter-spacing:.12em;color:#91cba7}.hb-research-overview p{font-size:13px;line-height:1.6;margin:7px 0;color:#e0eee4}.hb-research-overview small,.hb-research-muted{font-size:10px;color:#9db5a6}
      .hb-research-taxonomy,.hb-research-insights{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:9px}.hb-research-taxonomy>div,.hb-research-insights>div{padding:10px;border:1px solid #294b38;border-radius:9px;background:#0b1c13;min-width:0}.hb-research-taxonomy small,.hb-research-insights small{display:block;color:#91aa9b;font-size:9px;letter-spacing:.09em;margin-bottom:5px}.hb-research-taxonomy strong,.hb-research-insights strong{display:block;font-size:12px;line-height:1.45;overflow-wrap:anywhere}.hb-research-taxonomy>a{display:flex;align-items:center;gap:5px;color:#a8d5b5;font-size:11px}
      .hb-research-columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:10px}.hb-research-columns section,.hb-research-literature{border:1px solid #294b38;border-radius:10px;padding:12px;min-width:0}.hb-research-columns h5,.hb-research-literature h5{font-size:11px;letter-spacing:.08em;margin:0 0 8px;color:#a9d6b6}.hb-research-columns h5 span{display:block;font-size:9px;color:#91aa9b;font-weight:400;margin-top:4px}.hb-research-columns article,.hb-research-literature article{padding:9px 0;border-top:1px solid #294b38}.hb-research-columns article:first-of-type,.hb-research-literature article:first-of-type{border-top:0}.hb-research-columns article strong,.hb-research-literature article strong{font-size:11px;line-height:1.45;display:block}.hb-research-columns article p,.hb-research-literature article p{font-size:10px;line-height:1.5;color:#a6bdad;margin:4px 0}.hb-research-columns article small,.hb-research-literature article small{font-size:9px;color:#91aa9b;display:block}.hb-research-columns article a,.hb-research-literature article a{display:inline-flex;align-items:center;gap:3px;color:#a8d5b5;font-size:10px;margin-top:5px}
      .hb-research-literature{margin-top:10px}.hb-research-sources{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:10px}.hb-research-sources>a{display:inline-flex;align-items:center;gap:4px;color:#a8d5b5;text-decoration:none}.hb-research-sources>a small{display:none}.hb-research-warnings{display:flex;gap:8px;margin-top:10px;padding:10px;border:1px solid #385a46;border-radius:9px;color:#9db5a6}.hb-research-warnings svg{flex:none;margin-top:2px}.hb-research-warnings p{font-size:10px;line-height:1.5;margin:0 0 4px}.hb-research-warnings p:last-child{margin-bottom:0}
      @media(max-width:560px){.hb-research-form{flex-direction:column}.hb-research-form button{width:100%}}
    `}</style>
    <span className="hb-research-title">{section.toUpperCase()} / SERVER-SIDE RESEARCH BRIDGE</span>
    <h4>{title}</h4><p>{description}</p>
    <div className="hb-research-form"><input value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !loading) search(); }} placeholder="e.g. Ganga dolphin, neem distribution, mangrove biodiversity…" aria-label="Research query"/><button onClick={search} disabled={loading}>{loading ? <><LoaderCircle className="spin" size={14}/> Searching</> : <><Search size={14}/> Research</>}</button></div>
    {error && <div className="hb-research-error">{error}</div>}
    {result && <ResearchBridgeResults result={result}/>}
    {(aiLoading || aiAnswer || aiError) && <section className="hb-ai-interpretation" style={{marginTop:12,padding:14,border:"1px solid #5a8b65",borderRadius:11,background:"linear-gradient(145deg,#10271a,#0a1b12)"}}>
      <div style={{font:"9px ui-monospace,monospace",letterSpacing:".12em",color:"#a7e5b6"}}><Sparkles size={13} style={{verticalAlign:"middle",marginRight:6}}/>HERABRIUM AI / SOURCE-GROUNDED INTERPRETATION</div>
      {aiLoading&&<p style={{fontSize:11,color:"#a6bdad"}}>Organising retrieved evidence with OpenRouter…</p>}
      {aiAnswer&&<div style={{whiteSpace:"pre-wrap",fontSize:12,lineHeight:1.75,color:"#e0eee4",marginTop:10}}>{aiAnswer}</div>}
      {aiError&&<p style={{fontSize:10,color:"#ffc4a3",marginTop:8}}>AI layer unavailable: {aiError} The structured research records above remain available.</p>}
    </section>}
  </section>;
}
