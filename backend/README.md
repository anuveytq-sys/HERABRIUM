# HERBARIUM API — Phase 1

FastAPI service for review-first document extraction.

## Run locally

    python -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
    uvicorn backend.main:app --reload --port 8000

Health: GET /health  
Capabilities: GET /api/v1/capabilities  
Extraction: POST /api/v1/extract (multipart field: file)

## Extraction behaviour

The current baseline uses a curated alias lexicon, boundary-aware matching and retained text context. PDF page numbers are included where available. It is intentionally labelled as a deterministic NLP baseline rather than a trained AI model. Results are candidate mentions and always require human review.

Scanned-image OCR, model-backed biomedical NER, persistent source storage and user authentication are not included in Phase 1. Do not treat extracted mentions as verified research claims.

## Deployment

The frontend is configured for Vercel static hosting. Deploy this API separately to a Python-compatible host, then set VITE_API_BASE_URL at frontend build time. CORS is permissive for the prototype; restrict allowed origins before production use.


## Section-aware public research bridge

The server-only research bridge is registered at:

    POST /api/v1/research/query

Example request:

    {
      "query": "Ganga dolphin",
      "section": "biosphere"
    }

Supported section keys include `biosphere`, `risk`, `climate`, `provenance`,
`econetwork`, `conservation`, `sustainability`, `ethno`, `specimen`,
`intelligence`, `graph`, `gaps`, `documents`, `sources` and `general`.

The response is structured into a taxonomic match, section-specific evidence
summary, indexed occurrence count, a bounded sample of occurrence/specimen
records, Wikidata entity candidates, Crossref bibliographic candidates,
source links and explicit limitations. Public sources are queried live and
successful responses are cached in memory for five minutes. The bridge uses
official public APIs (GBIF, Wikidata and Crossref), not HTML scraping, and
requires no API keys. Public services may rate-limit or temporarily fail.

Important integration boundary: this endpoint is backend-only. Existing
frontend panels have not been modified and therefore do not call this endpoint
yet. A panel must send its current query and section key to this route before
the bridge can populate that panel. This backend-only change deliberately
preserves the frontend exactly as requested.

The bridge is limited to non-clinical taxonomy, biodiversity observations,
botanical/specimen provenance, ecological metadata and bibliographic
discovery. It does not perform pharmacological compound discovery or medical
assessment. All matches are research leads requiring source-level review.
