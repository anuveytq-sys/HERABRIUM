# HERBARIUM INTELLIGENCE — Phase 1 Architecture

## Product objective

Create a source-aware scientific intelligence foundation that connects plant profiles, traditional-knowledge documentation, compound mentions, scientific literature discovery and biodiversity discovery while keeping uncertainty visible.

## Implemented in this phase

1. Unified starter plant catalogue with scientific names, families, topics and compound candidates.
2. Source register with publisher, URL, source type, access date, record status and limitations.
3. Document upload UI for PDF, TXT and Markdown.
4. FastAPI extraction endpoint with size/type validation, PDF page extraction and an explainable lexicon/pattern NLP baseline.
5. Candidate entities retain a text excerpt and confidence heuristic; all results require human review.
6. Interactive SVG knowledge graph linking a selected plant to candidate compounds, discovery sources and a knowledge-record placeholder.
7. Research-gap cards derived from explicit missing fields in the starter dataset.
8. Knowledge stewardship UI for attribution, permission-aware records and human review.
9. Scroll-led sci-fi interface with a Three.js globe, animated orbital rings, GSAP reveal transitions, responsive layout and reduced-motion support.

## Data model principles

- A source link is a discovery entry point, not proof of a claim.
- A demonstration relationship must remain labelled as a starter/demo relationship until validated against a primary source.
- Evidence, traditional documentation, botanical identity, compound mentions and conservation observations are separate record types.
- Each trusted record should retain source identifier, source URL/DOI, publisher/author, access date, extraction method, page/section context, review status and licence/permission metadata.
- Sensitive community knowledge must support restricted access and consent-based contribution.

## Research-gap logic

Current gap cards describe incomplete fields in the included demo catalogue. They do not claim to have measured global scientific research coverage. A future gap engine should calculate gaps from a documented corpus and explain its coverage window, search strategy and thresholds.

## Current limitations

- Demo catalogue contains three starter profiles.
- PubMed and GBIF links are search pages; no record-level API ingestion is claimed.
- Compound associations are exploratory starter labels and need source-level verification.
- The graph is interactive but currently uses a transparent starter relationship model.
- NLP extraction is deterministic and explainable; it is not a trained model.
- No persistent database, user accounts, community submission workflow, OCR or clinical evidence grading is included yet.

## Verification checklist

- Frontend: npm ci, npm run typecheck, npm run build.
- API: pip install -r backend/requirements.txt, then run uvicorn and query /health and /api/v1/capabilities.
- Upload test: process a UTF-8 text file containing a known plant or compound term; inspect the retained excerpt and review warning.
- UI: test mobile width, keyboard navigation, reduced-motion mode and source drawer links.
