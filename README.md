# HERBARIUM INTELLIGENCE

**The Global Scientific Intelligence Network for Medicinal Plants**

HERBARIUM connects documented traditional knowledge, plant identity, natural-compound research, scientific literature and biodiversity discovery. Phase 1 establishes the source-aware intelligence core: structured plant profiles, provenance records, review-first document extraction, an interactive knowledge graph and transparent research-gap cards.

## Phase 1 experience

- Cinematic, scroll-driven science-fiction interface with an interactive Three.js globe.
- Searchable botanical starter catalogue.
- Source register with publisher, URL, record type, access date and limitations.
- Interactive plant relationship graph.
- Research-gap cards based on explicit missing fields in the demo catalogue.
- PDF/TXT/Markdown upload workflow backed by a FastAPI extraction service.
- Human-review-first candidate entity extraction with retained text context.
- Responsible knowledge stewardship: attribution, permissions and provenance.

## Run the frontend

    npm install
    npm run dev

Production build:

    npm run typecheck
    npm run build

## Run the optional API

    python -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
    uvicorn backend.main:app --reload --port 8000

Set VITE_API_BASE_URL=http://localhost:8000 in a local .env file to connect the frontend to the API. Without it, the website remains usable in local demo mode and displays that API extraction is not configured.

## Scientific integrity and current scope

The included turmeric, neem and holy basil profiles are starter demonstration records. PubMed and GBIF links are discovery/search pages, not individual verified citations. Compound labels and relationships are exploratory and must be validated against primary sources. The research-gap cards describe missing fields in this small starter dataset, not global research gaps.

The extraction service is an explainable lexicon-and-pattern NLP baseline, not a trained biomedical AI model. It returns candidate mentions, text context and heuristic confidence values; every result requires human review. It does not diagnose, prescribe or establish the safety or efficacy of any plant or compound.

Traditional and Indigenous knowledge must retain attribution, cultural context and permission boundaries. Do not publish sensitive knowledge without appropriate consent and access controls.

See [Phase 1 architecture](docs/PHASE-1-ARCHITECTURE.md) and [API documentation](backend/README.md).

## Tech stack

React, TypeScript, Vite, Three.js, GSAP, FastAPI and PyMuPDF. Core frontend operation does not require a paid API.

## Deployment

Vercel is configured to build the frontend from the repository root using npm run build and publish dist/. The FastAPI service is a separate deployment and is not included in the static Vercel build.
