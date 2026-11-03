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
