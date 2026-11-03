from __future__ import annotations

import csv
import io
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any

import fitz
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/v1/ethno", tags=["EthnoKnowledge AI"])
MAX_BYTES = 12 * 1024 * 1024
SUPPORTED = {".pdf", ".txt", ".md"}

# Curated starter alias map for language-aware discovery. Matches are candidates,
# never proof of botanical identity or efficacy.
PLANT_LEXICON: dict[str, dict[str, Any]] = {
    "Curcuma longa": {"family":"Zingiberaceae","aliases":{
        "en":["turmeric"],"hi":["हल्दी","हरिद्रा"],"sa":["हरिद्रा"],"bn":["হলুদ"],"ta":["மஞ்சள்"],"te":["పసుపు"],"mr":["हळद"],"historical":["haridra","haldi","halad","manjal","pasupu","holud"]}},
    "Azadirachta indica": {"family":"Meliaceae","aliases":{
        "en":["neem"],"hi":["नीम","निम्ब"],"sa":["निम्ब"],"bn":["নিম"],"ta":["வேம்பு"],"te":["వేప"],"mr":["कडुनिंब"],"historical":["nimba","veppu","vepachettu"]}},
    "Ocimum tenuiflorum": {"family":"Lamiaceae","aliases":{
        "en":["holy basil","tulsi"],"hi":["तुलसी"],"sa":["तुलसी"],"bn":["তুলসী"],"ta":["துளசி"],"te":["తులసి"],"mr":["तुळस"],"historical":["tulasi","vrinda","surasa"]}},
    "Withania somnifera": {"family":"Solanaceae","aliases":{
        "en":["ashwagandha","winter cherry"],"hi":["अश्वगंधा"],"sa":["अश्वगन्धा"],"bn":["অশ্বগন্ধা"],"ta":["அமுக்கரா"],"te":["అశ్వగంధ"],"mr":["अश्वगंधा"],"historical":["ashvagandha","asvagandha","amukkara"]}},
    "Tinospora cordifolia": {"family":"Menispermaceae","aliases":{
        "en":["giloy","guduchi"],"hi":["गिलोय","गुडूची"],"sa":["गुडूची"],"bn":["গুলঞ্চ"],"ta":["சீந்தில்"],"te":["తిప్పతీగ"],"mr":["गुळवेल"],"historical":["guduchi","amrita","giloya"]}},
}
REGIONS = [
 {"region":"South Asia","languages":["Hindi","Sanskrit","Bengali","Tamil","Telugu","Marathi"],"plants":["Curcuma longa","Azadirachta indica","Ocimum tenuiflorum","Withania somnifera"],"note":"Illustrative discovery grouping; not a claim of exclusive origin or uniform community practice."},
 {"region":"East Asia","languages":["Chinese","Japanese","Korean"],"plants":[],"note":"Expansion-ready region. No records are asserted until sourced and reviewed."},
 {"region":"West Africa","languages":["Yoruba","Akan","Hausa"],"plants":[],"note":"Expansion-ready region. Community attribution and consent are required before ingesting knowledge."},
]
APPLICATION_TOPICS = ["Food and culinary documentation","Agricultural and ecological use","Material and craft traditions","Cultural and ceremonial documentation","Historical materia medica"]
ATTRIBUTION_STATES = ["Publicly documented source","Community-authorised record","Restricted / consent required","Attribution incomplete","Unknown — review required"]

def _read_upload(filename: str, data: bytes) -> tuple[str, list[dict[str, Any]]]:
    suffix = "." + filename.rsplit(".",1)[-1].lower() if "." in filename else ""
    if suffix not in SUPPORTED: raise HTTPException(415, "Only PDF, TXT and Markdown files are supported.")
    if len(data) > MAX_BYTES: raise HTTPException(413, "File exceeds the 12 MB limit.")
    if not data: raise HTTPException(400, "The uploaded file is empty.")
    pages: list[dict[str, Any]] = []
    if suffix == ".pdf":
        try: doc = fitz.open(stream=data, filetype="pdf")
        except Exception as exc: raise HTTPException(400, "The PDF could not be opened.") from exc
        for i, page in enumerate(doc):
            text = page.get_text("text")
            tables = []
            try:
                found = page.find_tables()
                tables = [table.extract() for table in found.tables[:8]]
            except Exception: pass
            pages.append({"page":i+1,"text":text,"tables":tables})
        doc.close()
    else:
        try: text = data.decode("utf-8-sig")
        except UnicodeDecodeError as exc: raise HTTPException(400, "Text files must use UTF-8 encoding.") from exc
        pages = [{"page":1,"text":text,"tables":[]}]
    if not any(p["text"].strip() for p in pages):
        raise HTTPException(422, "No selectable text was found. Scanned-image OCR is not included in this release.")
    return "\n".join(p["text"] for p in pages), pages

def _matches(text: str) -> list[dict[str, Any]]:
    found = []
    for scientific, record in PLANT_LEXICON.items():
        hits = []
        for language, aliases in record["aliases"].items():
            for alias in aliases:
                for match in re.finditer(re.escape(alias), text, re.I):
                    start,end = match.span()
                    excerpt = re.sub(r"\s+"," ",text[max(0,start-100):min(len(text),end+140)]).strip()
                    hits.append({"matched_term":alias,"language":language,"excerpt":excerpt})
        if hits:
            unique = {(h["matched_term"].casefold(),h["language"]):h for h in hits}
            found.append({"scientific_name":scientific,"family":record["family"],"mentions":list(unique.values()),"mention_count":len(hits),"identity_status":"candidate — taxonomist review required"})
    return found

def _citations(text: str) -> list[dict[str, str]]:
    patterns = [
      ("DOI",r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+"),
      ("PMID",r"\bPMID\s*:?\s*\d{5,9}\b"),
      ("URL",r"https?://[^\s)\]}>]+"),
      ("Author-year",r"\b[A-Z][A-Za-z'-]+(?:\s+et\s+al\.)?\s*\(?(?:18|19|20)\d{2}\)?"),
    ]
    output=[]
    for kind,pattern in patterns:
        for value in re.findall(pattern,text,re.I):
            value=value.rstrip(".,;")
            if not any(x["value"].casefold()==value.casefold() for x in output):
                output.append({"type":kind,"value":value,"verification":"candidate reference — verify bibliographic metadata"})
    return output[:100]

def _timeline(text: str) -> list[dict[str, Any]]:
    years=Counter(re.findall(r"\b(?:1[6-9]\d{2}|20\d{2})\b",text))
    return [{"year":int(year),"mentions":count,"context":"Year detected in document text; event meaning requires review."} for year,count in sorted(years.items())][:80]

def _sentences(text: str) -> list[str]:
    chunks=[re.sub(r"\s+"," ",x).strip() for x in re.split(r"(?<=[.!?।])\s+|\n+",text)]
    return [x for x in chunks if len(x)>65]

def _quality(filename: str, text: str, citations: list[dict[str,str]]) -> dict[str, Any]:
    has_author=bool(re.search(r"\b(author|edited by|compiled by|प्रकाशक|लेखक)\b",text,re.I))
    has_year=bool(re.search(r"\b(?:18|19|20)\d{2}\b",text))
    score=min(100,25 + (25 if citations else 0) + (15 if has_author else 0) + (15 if has_year else 0) + (20 if len(text)>1200 else 0))
    return {"score":score,"band":"strong metadata signals" if score>=75 else "partial metadata signals" if score>=45 else "limited metadata signals",
            "signals":{"citation_candidates":len(citations),"author_metadata_detected":has_author,"year_detected":has_year,"text_length":len(text)},
            "warning":"Heuristic metadata completeness only. This is not a peer-review, source-trustworthiness or scientific-quality score."}

def _analyze(filename: str, data: bytes, region: str = "Unspecified") -> dict[str, Any]:
    text,pages=_read_upload(filename,data)
    plants=_matches(text)
    citations=_citations(text)
    years=_timeline(text)
    sentences=_sentences(text)
    ranked=sorted(sentences,key=lambda s:(sum(1 for p in plants if p["scientific_name"].casefold() in s.casefold() or any(m["matched_term"].casefold() in s.casefold() for m in p["mentions"])) * 3,-len(s)),reverse=True)
    summary=ranked[:4]
    classifications=[]
    low=text.casefold()
    for topic,terms in {
      "Historical materia medica":["materia medica","pharmacopoeia","formulary","herbal","traditional medicine"],
      "Food and culinary documentation":["food","culinary","spice","diet","recipe"],
      "Agricultural and ecological use":["agriculture","pest","soil","crop","ecology"],
      "Cultural and ceremonial documentation":["ceremon","ritual","festival","sacred","worship"],
    }.items():
        if any(term in low for term in terms): classifications.append(topic)
    missing=[]
    if not citations: missing.append("No citation-like strings detected; add full source details.")
    if not re.search(r"\b(author|edited by|compiled by)\b",low): missing.append("Author/compiler attribution not detected.")
    if not re.search(r"\b(?:18|19|20)\d{2}\b",text): missing.append("Publication or historical year not detected.")
    if not plants: missing.append("No known plant alias matched; check spelling, language and transliteration.")
    if not re.search(r"\b(consent|permission|community|licen[cs]e|public domain)\b",low): missing.append("No permission/licence statement detected; check access rights before reuse.")
    duplicate_signals=[]
    normalized=re.sub(r"\W+"," ",low).strip()
    if len(normalized)>80 and normalized.count(" ")>0:
        duplicate_signals.append({"type":"within-document-repeat-check","detail":"Automated near-duplicate comparison is limited to exact normalised paragraph repeats in this document."})
    paragraphs=[re.sub(r"\s+"," ",p).strip().casefold() for p in re.split(r"\n\s*\n",text) if len(p.strip())>100]
    repeats=[p for p,n in Counter(paragraphs).items() if n>1]
    duplicate_signals += [{"type":"duplicate-paragraph","detail":"Repeated paragraph detected: "+p[:180]} for p in repeats[:10]]
    return {
      "document_name":filename,"region_context":region,"processed_at":datetime.now(timezone.utc).isoformat(),
      "classification":classifications or ["Unclassified — manual review required"],
      "plant_entities":plants,
      "citations":citations,"timeline":years,"summary_candidates":summary,
      "table_extraction":{"tables_detected":sum(len(p["tables"]) for p in pages),"tables":[{"page":p["page"],"rows":t[:30]} for p in pages for t in p["tables"][:4]]},
      "source_quality":_quality(filename,text,citations),"missing_attribution_warnings":missing,
      "duplicate_signals":duplicate_signals,"page_count":len(pages),
      "language_support_note":"Alias coverage includes a small curated English, Hindi, Sanskrit, Bengali, Tamil, Telugu and Marathi starter lexicon plus historical transliteration variants. This is not full multilingual NLP.",
      "ethical_status":"Unreviewed research candidate. Traditional knowledge is not public-domain by default; confirm attribution, consent, licence and community restrictions.",
      "review_required":True
    }

@router.get("/catalog")
def catalog() -> dict[str, Any]:
    return {"plant_lexicon":PLANT_LEXICON,"regions":REGIONS,"application_topics":APPLICATION_TOPICS,"attribution_states":ATTRIBUTION_STATES}

@router.post("/analyze")
async def analyze(file: UploadFile = File(...), region: str = Form("Unspecified")) -> dict[str, Any]:
    name=(file.filename or "research-document").split("/")[-1].split("\\")[-1]
    data=await file.read(MAX_BYTES+1)
    return _analyze(name,data,region)

@router.post("/compare")
async def compare(files: list[UploadFile] = File(...), region: str = Form("Unspecified")) -> dict[str, Any]:
    if len(files)<2: raise HTTPException(400,"Upload at least two publications to compare.")
    if len(files)>5: raise HTTPException(400,"Compare up to five documents at a time.")
    results=[]
    for file in files:
        name=(file.filename or "research-document").split("/")[-1].split("\\")[-1]
        data=await file.read(MAX_BYTES+1)
        results.append(_analyze(name,data,region))
    counts=Counter(p["scientific_name"] for result in results for p in result["plant_entities"])
    shared=[name for name,count in counts.items() if count>1]
    year_sets=[{x["year"] for x in r["timeline"]} for r in results]
    return {"documents":results,"shared_plant_entities":shared,
      "document_overlap":[{"plant":name,"document_count":counts[name]} for name in shared],
      "timeline_comparison":[{"document":r["document_name"],"years":[x["year"] for x in r["timeline"]]} for r in results],
      "review_flags":["Different documents may use the same name for different taxa or different names for the same taxon; verify synonyms and publication context.",
      "This comparison detects text overlap and metadata differences, not scientific agreement, safety, efficacy or clinical outcomes."],
      "comparison_mode":"rule-based cross-publication discovery; human review required"}

@router.post("/export")
async def export_analysis(payload: dict[str, Any], format: str = Form("json")):
    if format=="csv":
        rows=[]
        for plant in payload.get("plant_entities",[]):
            for mention in plant.get("mentions",[]):
                rows.append({"scientific_name":plant.get("scientific_name"),"family":plant.get("family"),"matched_term":mention.get("matched_term"),"language":mention.get("language"),"evidence":mention.get("excerpt")})
        stream=io.StringIO()
        writer=csv.DictWriter(stream,fieldnames=["scientific_name","family","matched_term","language","evidence"])
        writer.writeheader();writer.writerows(rows)
        return StreamingResponse(iter([stream.getvalue()]),media_type="text/csv",headers={"Content-Disposition":"attachment; filename=herbarium-ethnoknowledge.csv"})
    from fastapi.responses import JSONResponse
    return JSONResponse(payload,headers={"Content-Disposition":"attachment; filename=herbarium-ethnoknowledge.json"})
