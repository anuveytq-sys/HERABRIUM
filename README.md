# HERBARIUM INTELLIGENCE

**A source-aware botanical, ethnobotanical and biodiversity research workspace.**

HERBARIUM brings botanical identity, documented cultural context, historical publications, herbarium specimens and biodiversity records into one traceable interface. It keeps extracted candidates separate from reviewed records and preserves provenance, attribution and uncertainty.

## Phase 1 — Scientific Intelligence Core

- Cinematic, scroll-led interface with Three.js globe, animated orbital elements and GSAP transitions.
- Searchable starter plant catalogue with scientific names, families, botanical topics and source registers.
- Provenance drawer showing publisher, source URL, record type, access date and limitations.
- Interactive relationship graph connecting a plant taxon to taxonomy, specimen, archive and source records.
- Data-quality gap cards derived from missing fields in the starter dataset.
- PDF, TXT and Markdown document upload with page-aware text extraction.
- Explainable plant-name candidate extraction with retained text context and mandatory human review.
- Permission-aware knowledge stewardship: attribution, cultural context, licence and consent checks.

## Phase 2 — EthnoKnowledge AI

- Historical botanical document exploration and text extraction.
- Curated English, Hindi, Sanskrit, Bengali, Tamil, Telugu and Marathi plant-name alias matching.
- Historical spelling and transliteration variants.
- Plant-name candidates with language labels and nearby text excerpts.
- Citation-pattern extraction (DOI, PMID, URL and author-year candidates).
- Timeline year markers, topic classification and extractive summary candidates.
- PDF table extraction where selectable text and table structure are available.
- Metadata completeness signals, missing-attribution warnings and repeated-paragraph detection.
- Cross-document comparison for up to five publications, including shared plant mentions, timeline differences and overlap indicators.
- JSON and CSV exports.

## Phase 3 — Biodiversity & Specimen Intelligence

- Searchable botanical specimen catalogue with starter taxonomy records.
- Scientific name, common name, family, genus, broad region and habitat context.
- Interactive 3D illustrative leaf model with drag-to-rotate interaction.
- Botanical record comparison for up to three taxa.
- JSON catalogue export.
- Institutional herbarium source links and specimen-verification guidance.
- Provenance and data-quality warnings so illustrative records are never presented as verified vouchers.

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

Set `VITE_API_BASE_URL=http://localhost:8000` in a local `.env` file to connect the frontend to the API. Without it, the website remains usable in local demo mode.

## Data integrity and limitations

- Included plant profiles and specimen records are starter demonstrations, not a complete flora or verified voucher collection.
- The Indian Virtual Herbarium is an institutional reference entry point; HERBARIUM does not claim to have bulk-imported its specimen data.
- Geographic labels are broad context only, not precise occurrence coordinates.
- Document extraction is an explainable lexicon-and-pattern baseline, not a trained multilingual model.
- Scanned-image OCR is not included. PDFs need selectable text.
- Citation, timeline and summary outputs are candidates and require human review.
- Metadata completeness is not a measure of source quality or scientific validity.
- No diagnosis, prescribing, personal medical suitability, efficacy assessment or pharmacological compound discovery/screening is provided.

Traditional and Indigenous knowledge must retain attribution, cultural context and permission boundaries. Public accessibility does not automatically grant permission to reuse knowledge.

## Official botanical references

- Botanical Survey of India — [Indian Virtual Herbarium](https://ivh.bsi.gov.in/)
- Botanical Survey of India — [Virtual Herbarium overview](https://bsi.gov.in/page/en/virtual-herbarium)
- Royal Botanic Gardens, Kew — [Herbarium collections](https://www.kew.org/science/collections-and-resources/collections/herbarium)

## Tech stack

React, TypeScript, Vite, Three.js, GSAP, FastAPI and PyMuPDF. Core frontend operation does not require a paid API.

## Deployment

**Live website:** https://herbarium-intelligence.vercel.app


Vercel builds the frontend from the repository root using `npm run build` and publishes `dist/`. The FastAPI service requires a Python-compatible deployment target.
