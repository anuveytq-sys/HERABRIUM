from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/phytoevidence", tags=["HERABRIUM PhytoEvidence"])

# Phase 5 is deliberately scoped to non-clinical botanical and biodiversity
# scholarship. It does not retrieve or rank pharmacological/therapeutic studies.
BLOCKED = re.compile(
    r"\b(drug|medicine|medicinal|pharma\w*|pharmac\w*|compound|molecule|"
    r"bioactiv\w*|therapeutic|therapy|dosage|dose|treatment|cure|efficacy|"
    r"clinical|patient|toxicit\w*|admet)\b", re.I
)
STUDY_RULES = [
    ("Taxonomic research", ("taxonomy", "taxonomic", "systematic revision", "new species", "species description")),
    ("Biodiversity survey", ("biodiversity", "species richness", "flora", "fauna", "checklist", "inventory")),
    ("Ecological field study", ("ecology", "habitat", "pollination", "distribution", "field survey", "vegetation")),
    ("Conservation assessment", ("conservation", "threatened", "endangered", "red list", "protected area")),
    ("Herbarium / specimen study", ("herbarium", "herbarium specimen", "collection digitization", "voucher specimen")),
    ("Methods / data paper", ("dataset", "data paper", "methodology", "protocol", "remote sensing")),
    ("Review / synthesis", ("review", "systematic review", "meta-analysis", "bibliometric")),
]

class EvidenceQuery(BaseModel):
    query: str = Field(min_length=2, max_length=160)
    year_from: int | None = Field(default=None, ge=1700, le=2100)
    year_to: int | None = Field(default=None, ge=1700, le=2100)
    open_access_only: bool = False

def _get(url: str) -> dict[str, Any]:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "HERABRIUM-PhytoEvidence/1.0"})
    try:
        with urlopen(request, timeout=9) as response:
            import json
            return json.loads(response.read(4_000_000).decode("utf-8"))
    except Exception as exc:
        raise RuntimeError("A public scholarly metadata source is temporarily unavailable.") from exc

def _abstract(index: dict[str, list[int]] | None) -> str:
    if not index:
        return ""
    words = [""] * (max((max(pos) for pos in index.values() if pos), default=-1) + 1)
    for word, positions in index.items():
        for position in positions:
            if 0 <= position < len(words):
                words[position] = word
    return " ".join(word for word in words if word)[:2200]

def _classify(title: str, abstract: str, work_type: str) -> str:
    text = (title + " " + abstract + " " + work_type).casefold()
    for label, terms in STUDY_RULES:
        if any(term in text for term in terms):
            return label
    return "Scholarly record — type not classified"

def _crossref_fallback(query: str, body: "EvidenceQuery") -> dict[str, Any]:
    """Use Crossref public metadata if OpenAlex is temporarily unreachable."""
    filters = []
    if body.year_from:
        filters.append(f"from-pub-date:{body.year_from}")
    if body.year_to:
        filters.append(f"until-pub-date:{body.year_to}")
    params = {
        "query.bibliographic": query,
        "rows": "30",
        "select": "DOI,title,published,author,container-title,URL,type,abstract,license",
    }
    if filters:
        params["filter"] = ",".join(filters)
    payload = _get("https://api.crossref.org/works?" + urlencode(params))
    message = payload.get("message") or {}
    works = []
    for item in message.get("items", []):
        title = ((item.get("title") or [""])[0] or "").strip()
        abstract = re.sub(r"<[^>]+>", " ", item.get("abstract") or "")
        abstract = re.sub(r"\\s+", " ", abstract).strip()[:2200]
        if not title or BLOCKED.search(title) or (abstract and BLOCKED.search(abstract)):
            continue
        date_parts = ((item.get("published") or {}).get("date-parts") or [[]])[0]
        year = date_parts[0] if date_parts and isinstance(date_parts[0], int) else None
        if body.year_from and year and year < body.year_from:
            continue
        if body.year_to and year and year > body.year_to:
            continue
        licenses = item.get("license") or []
        open_access = bool(licenses)
        if body.open_access_only and not open_access:
            continue
        authors = []
        for author in (item.get("author") or [])[:5]:
            name = " ".join(part for part in (author.get("given"), author.get("family")) if part).strip()
            if name:
                authors.append(name)
        doi = item.get("DOI")
        url = item.get("URL") or (f"https://doi.org/{doi}" if doi else "")
        works.append({
            "id": f"https://doi.org/{doi}" if doi else url or title,
            "title": title,
            "year": year,
            "authors": authors,
            "venue": ((item.get("container-title") or [""])[0] or ""),
            "doi": doi,
            "url": url,
            "open_access": open_access,
            "study_type": _classify(title, abstract, item.get("type") or ""),
            "abstract": abstract,
            "metadata_type": item.get("type") or "not supplied",
            "source": "Crossref",
            "source_url": url,
            "limitations": "Crossref fallback metadata may be incomplete. A listed licence is not a guarantee of full-text access; verify the original record and licence.",
        })
    years = [work["year"] for work in works if isinstance(work["year"], int)]
    return {
        "query": query,
        "source": "Crossref public scholarly metadata API (OpenAlex fallback)",
        "source_status": "fallback",
        "total_matched": message.get("total-results", len(works)),
        "returned": len(works),
        "works": works,
        "coverage": {
            "with_abstract": sum(bool(work["abstract"]) for work in works),
            "open_access": sum(work["open_access"] for work in works),
            "with_year": len(years),
            "year_span": [min(years), max(years)] if years else None,
            "classified_types": sorted({work["study_type"] for work in works}),
        },
        "warnings": [
            "OpenAlex was temporarily unavailable; these candidates came from Crossref as a fallback.",
            "Crossref metadata and abstracts may be incomplete. Verify each original publication and its licence.",
            "Study-type labels are automated title/abstract classifications and require human review.",
        ],
        "review_required": True,
    }

@router.get("/health")
def health() -> dict[str, str]:
    return {"service": "herabrium-phytoevidence", "status": "ready", "source": "OpenAlex"}

@router.post("/search")
def search_evidence(body: EvidenceQuery) -> dict[str, Any]:
    query = re.sub(r"\s+", " ", body.query).strip()
    if BLOCKED.search(query):
        raise HTTPException(status_code=400, detail="PhytoEvidence supports botanical taxonomy, biodiversity, ecology, herbarium and conservation literature only.")
    if body.year_from and body.year_to and body.year_from > body.year_to:
        raise HTTPException(status_code=400, detail="The starting year must not be later than the ending year.")
    filters = []
    if body.year_from:
        filters.append(f"from_publication_date:{body.year_from}-01-01")
    if body.year_to:
        filters.append(f"to_publication_date:{body.year_to}-12-31")
    if body.open_access_only:
        filters.append("is_oa:true")
    params = {"search": query, "per-page": "30", "sort": "relevance_score:desc", "select": "id,doi,title,publication_year,type,authorships,primary_location,open_access,abstract_inverted_index,host_venue"}
    if filters:
        params["filter"] = ",".join(filters)
    try:
        payload = _get("https://api.openalex.org/works?" + urlencode(params))
    except RuntimeError:
        try:
            return _crossref_fallback(query, body)
        except RuntimeError:
            # Keep Nexus usable even if both public scholarly indexes are down.
            return {
                "query": query,
                "source": "OpenAlex / Crossref public scholarly metadata",
                "source_status": "temporarily_unavailable",
                "total_matched": 0,
                "returned": 0,
                "works": [],
                "coverage": {
                    "with_abstract": 0,
                    "open_access": 0,
                    "with_year": 0,
                    "year_span": None,
                    "classified_types": [],
                },
                "warnings": [
                    "OpenAlex and Crossref could not be reached during this request. No publication records are being presented; retry later.",
                    "This temporary source outage does not affect the separate taxonomy, specimen, occurrence or conservation research domains.",
                    "Publication discovery results require review of the original scholarly records.",
                ],
                "review_required": True,
            }
    works = []
    for item in payload.get("results", []):
        title = (item.get("title") or "").strip()
        abstract = _abstract(item.get("abstract_inverted_index"))
        if not title or BLOCKED.search(title) or (abstract and BLOCKED.search(abstract)):
            continue
        authors = []
        for author in (item.get("authorships") or [])[:5]:
            name = ((author.get("author") or {}).get("display_name") or "").strip()
            if name:
                authors.append(name)
        location = item.get("primary_location") or {}
        source = location.get("landing_page_url") or item.get("doi") or item.get("id")
        venue = ((location.get("source") or {}).get("display_name") or
                 (item.get("host_venue") or {}).get("display_name") or "")
        oa = item.get("open_access") or {}
        works.append({
            "id": item.get("id"), "title": title, "year": item.get("publication_year"),
            "authors": authors, "venue": venue, "doi": item.get("doi"),
            "url": source, "open_access": bool(oa.get("is_oa")),
            "study_type": _classify(title, abstract, item.get("type") or ""),
            "abstract": abstract, "metadata_type": item.get("type") or "not supplied",
            "source": "OpenAlex", "source_url": item.get("id"),
            "limitations": "Study type is a title/abstract keyword classification; inspect the original paper to verify methods, scope and conclusions."
        })
    years = [w["year"] for w in works if isinstance(w["year"], int)]
    return {
        "query": query, "source": "OpenAlex public scholarly metadata API",
        "source_status": "ready",
        "total_matched": payload.get("meta", {}).get("count", len(works)),
        "returned": len(works), "works": works,
        "coverage": {
            "with_abstract": sum(bool(w["abstract"]) for w in works),
            "open_access": sum(w["open_access"] for w in works),
            "with_year": len(years),
            "year_span": [min(years), max(years)] if years else None,
            "classified_types": sorted({w["study_type"] for w in works})
        },
        "warnings": [
            "Search results are bibliographic discovery records, not a systematic review or an assessment of scientific truth.",
            "Study-type labels are automated metadata classifications and require human verification.",
            "Abstract availability varies; missing abstracts do not mean a paper lacks evidence.",
            "The workspace is limited to non-clinical botanical, taxonomy, biodiversity, ecology, herbarium and conservation scholarship."
        ],
        "review_required": True
    }
