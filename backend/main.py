from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

APP_VERSION = "0.1.0"
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
ALLOWED_SUFFIXES = {".pdf", ".txt", ".md"}

# Explainable starter lexicon. Candidates are not verified facts and always require review.
PLANT_TERMS = {
    "Curcuma longa": ["curcuma longa", "turmeric"],
    "Azadirachta indica": ["azadirachta indica", "neem"],
    "Ocimum tenuiflorum": ["ocimum tenuiflorum", "ocimum sanctum", "holy basil", "tulsi"],
    "Withania somnifera": ["withania somnifera", "ashwagandha"],
    "Tinospora cordifolia": ["tinospora cordifolia", "giloy"],
}
COMPOUND_TERMS = [
    "curcumin", "demethoxycurcumin", "bisdemethoxycurcumin",
    "azadirachtin", "nimbin", "nimbolide", "eugenol",
    "ursolic acid", "rosmarinic acid", "withaferin A", "withanolide",
]

app = FastAPI(
    title="HERBARIUM Intelligence API",
    version=APP_VERSION,
    description="Explainable, review-first botanical document extraction API. It does not provide medical advice.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def extract_pdf_pages(data: bytes) -> list[tuple[int, str]]:
    try:
        document = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="The PDF could not be opened.") from exc
    pages = [(index + 1, page.get_text("text")) for index, page in enumerate(document)]
    document.close()
    return pages


def find_candidates(text: str, pages: list[tuple[int, str]]) -> list[dict[str, Any]]:
    normalized = text.casefold()
    found: dict[tuple[str, str], dict[str, Any]] = {}

    def add(term: str, kind: str, confidence: float, evidence: str) -> None:
        key = (term.casefold(), kind)
        if key not in found:
            found[key] = {
                "text": term,
                "entity_type": kind,
                "confidence": confidence,
                "evidence": evidence[:260],
            }

    for scientific_name, aliases in PLANT_TERMS.items():
        for alias in aliases:
            match = re.search(r"(?<!\w)" + re.escape(alias) + r"(?!\w)", normalized)
            if match:
                page_number = next((number for number, page_text in pages if alias in page_text.casefold()), None)
                excerpt = text[max(0, match.start() - 90): min(len(text), match.end() + 130)].replace("\n", " ")
                add(scientific_name, "plant", 0.94 if alias == scientific_name.casefold() else 0.82,
                    (f"Page {page_number}: " if page_number else "") + excerpt)
                break

    for compound in COMPOUND_TERMS:
        match = re.search(r"(?<!\w)" + re.escape(compound) + r"(?!\w)", normalized)
        if match:
            page_number = next((number for number, page_text in pages if compound in page_text.casefold()), None)
            excerpt = text[max(0, match.start() - 90): min(len(text), match.end() + 130)].replace("\n", " ")
            add(compound.title(), "compound", 0.86,
                (f"Page {page_number}: " if page_number else "") + excerpt)

    return list(found.values())


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "herbarium-intelligence-api", "version": APP_VERSION}


@app.get("/api/v1/capabilities")
def capabilities() -> dict[str, Any]:
    return {
        "document_formats": sorted(ALLOWED_SUFFIXES),
        "max_upload_bytes": MAX_UPLOAD_BYTES,
        "extraction_mode": "explainable-lexicon-and-pattern-NLP-baseline",
        "review_required": True,
        "features": ["plant-mention-candidates", "compound-mention-candidates", "page-context", "provenance-ready-output"],
    }


@app.post("/api/v1/extract")
async def extract_document(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = Path(file.filename or "research-document").name
    suffix = Path(filename).suffix.casefold()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415, detail="Only PDF, TXT and Markdown files are supported.")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 12 MB limit.")
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if suffix == ".pdf":
        pages = extract_pdf_pages(data)
    else:
        try:
            pages = [(1, data.decode("utf-8-sig"))]
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="Text files must use UTF-8 encoding.") from exc

    combined = "\n".join(page_text for _, page_text in pages)
    if not combined.strip():
        raise HTTPException(status_code=422, detail="No selectable text was found. Scanned-image OCR is not included in this phase.")

    entities = find_candidates(combined, pages)
    return {
        "document_name": filename,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "extraction_mode": "explainable-lexicon-and-pattern-NLP-baseline",
        "review_required": True,
        "extracted_entities": entities,
        "source_notes": ["Uploaded document: " + filename, "PDF page context is retained in candidate evidence when available."],
        "warnings": [
            "These are candidate text mentions, not validated botanical identifications or scientific conclusions.",
            "A human reviewer must verify the original passage, taxonomic identity and source before creating a trusted record.",
            "This baseline is not a trained biomedical NER model and may miss synonyms, OCR text and unfamiliar species.",
        ],
    }


from .ethnoknowledge import router as ethnoknowledge_router
from .phytochem import router as phytochem_router

app.include_router(ethnoknowledge_router)
app.include_router(phytochem_router)
