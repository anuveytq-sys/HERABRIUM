import { useState } from "react";
import { FileUp, FileText, LoaderCircle, ShieldCheck } from "lucide-react";
import { extractDocument, type ExtractionResult } from "../lib/api";

export default function UploadLab() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function processFile() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try { setResult(await extractDocument(file)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not process this document."); }
    finally { setLoading(false); }
  }

  return <div className="upload-lab">
    <div className="upload-copy"><span className="eyebrow">DOCUMENT INTELLIGENCE / LAB 01</span><h3>Turn research documents into structured candidates.</h3><p>Upload a PDF or text document to extract candidate plant and compound mentions. The current backend uses an explainable dictionary-and-pattern NLP baseline; every result is marked for human review.</p><div className="assurance"><ShieldCheck size={16}/> Source context retained · No health advice generated</div></div>
    <div className="upload-console">
      <label className="dropzone">
        <input type="file" accept=".pdf,.txt,.md" onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); setError(""); }} />
        <FileUp size={28}/><strong>{file ? file.name : "Drop a research file here"}</strong><span>{file ? (file.size / 1024).toFixed(1) + " KB · Ready to process" : "PDF, TXT or Markdown · 12 MB max"}</span>
      </label>
      <button className="button button-primary full" onClick={processFile} disabled={!file || loading}>{loading ? <><LoaderCircle className="spin" size={16}/> Processing</> : "Extract candidate entities"}</button>
      {error && <div className="inline-warning">{error}</div>}
      {result && <div className="extraction-result">
        <div className="result-heading"><FileText size={16}/><strong>{result.document_name}</strong><span>{result.extraction_mode}</span></div>
        <div className="result-count">{result.extracted_entities.length} candidate entities · Human review {result.review_required ? "required" : "complete"}</div>
        {result.extracted_entities.length ? result.extracted_entities.map((entity, index) => <div className="entity-row" key={index}><span>{entity.text}</span><small>{entity.entity_type} · {Math.round(entity.confidence * 100)}% heuristic match</small></div>) : <p className="muted">No known candidate terms were detected. This does not mean the document contains no relevant information.</p>}
        {result.warnings.map((warning, index) => <p className="muted" key={index}>{warning}</p>)}
      </div>}
    </div>
  </div>;
}