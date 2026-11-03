from __future__ import annotations

import asyncio
import json
import re
import time
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request as URLRequest, urlopen

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/research", tags=["HERABRIUM Research Bridge"])

# This bridge is deliberately limited to non-clinical botany, taxonomy,
# biodiversity observations, specimen provenance and bibliographic metadata.
# It does not search or screen pharmacologically active compounds or provide
# medical/therapeutic guidance.

SECTION_NAMES = {
    "biosphere": "BioSphere 3D",
    "risk": "Biodiversity Risk Observatory",
    "climate": "Climate Intelligence",
    "provenance": "Botanical Provenance",
    "econetwork": "EcoNetwork Intelligence",
    "conservation": "Conservation Dashboard",
    "sustainability": "Sustainability Simulator",
    "ethno": "EthnoKnowledge AI",
    "specimen": "Botanical Specimen Intelligence",
    "intelligence": "Scientific Intelligence Core",
    "graph": "Relationship Intelligence",
    "gaps": "Botanical Data Quality",
    "documents": "Document Intelligence Lab",
    "sources": "Source Register",
    "general": "HERABRIUM Research",
}

# Common biodiversity names are resolved to scientific names before querying
# the public taxonomy service. The accepted GBIF match remains authoritative.
KNOWN_NAMES = {
    "ganga dolphin": "Platanista gangetica",
    "ganges dolphin": "Platanista gangetica",
    "ganges river dolphin": "Platanista gangetica",
    "gangetic dolphin": "Platanista gangetica",
    "south asian river dolphin": "Platanista gangetica",
}

RESTRICTED_RESEARCH_TERMS = re.compile(
    r"\b(drug|medicine|medicinal|pharma\w*|pharmac\w*|compound|molecule|"
    r"therapeutic|therapy|dosage|dose|treatment|cure|efficacy|admet|"
    r"toxicit\w*|bioactiv\w*)\b",
    re.IGNORECASE,
)

_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_RATE: dict[str, list[float]] = {}
CACHE_SECONDS = 300
RATE_WINDOW_SECONDS = 60
RATE_MAX_REQUESTS = 18


class ResearchQuery(BaseModel):
    query: str = Field(min_length=2, max_length=160)
    section: str = Field(default="general", max_length=40)


def _get_json(url: str, timeout: float = 9.0) -> dict[str, Any]:
    request = URLRequest(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "HERABRIUM-ResearchBridge/1.0 (public biodiversity research client)",
        },
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read(2_500_000)
        value = json.loads(raw.decode("utf-8"))
        return value if isinstance(value, dict) else {}
    except HTTPError as exc:
        if exc.code == 429:
            raise RuntimeError("A public data source is rate-limiting requests. Please wait and retry.") from exc
        raise RuntimeError(f"An external research source returned HTTP {exc.code}.") from exc
    except (URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise RuntimeError("A public research source could not be reached right now.") from exc


def _cached(key: str) -> dict[str, Any] | None:
    item = _CACHE.get(key)
    if not item:
        return None
    expires, payload = item
    if expires < time.time():
        _CACHE.pop(key, None)
        return None
    return payload


def _store_cache(key: str, payload: dict[str, Any]) -> None:
    now = time.time()
    if len(_CACHE) > 250:
        for old_key, (expiry, _) in list(_CACHE.items()):
            if expiry < now:
                _CACHE.pop(old_key, None)
        if len(_CACHE) > 250:
            _CACHE.pop(next(iter(_CACHE)))
    _CACHE[key] = (now + CACHE_SECONDS, payload)


def _rate_limit(client: str) -> None:
    now = time.time()
    recent = [stamp for stamp in _RATE.get(client, []) if now - stamp < RATE_WINDOW_SECONDS]
    if len(recent) >= RATE_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Research bridge rate limit reached. Wait one minute and retry.")
    recent.append(now)
    _RATE[client] = recent


def _clean_query(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value[:160]


def _gbif_taxon(query: str) -> dict[str, Any] | None:
    candidate = KNOWN_NAMES.get(query.casefold(), query)
    url = "https://api.gbif.org/v1/species/match?" + urlencode({"name": candidate, "strict": "false"})
    payload = _get_json(url)
    if not payload.get("key") or not payload.get("scientificName"):
        return None
    if payload.get("status") == "SYNONYM" and payload.get("acceptedUsageKey"):
        accepted = _get_json(f"https://api.gbif.org/v1/species/{int(payload['acceptedUsageKey'])}")
        if accepted.get("key") and accepted.get("scientificName"):
            payload["matched_as"] = payload.get("scientificName")
            payload = accepted
    return {
        "key": payload.get("key"),
        "scientific_name": payload.get("scientificName"),
        "canonical_name": payload.get("canonicalName"),
        "rank": payload.get("rank"),
        "taxonomic_status": payload.get("status"),
        "confidence": payload.get("confidence"),
        "kingdom": payload.get("kingdom"),
        "phylum": payload.get("phylum"),
        "class": payload.get("class"),
        "order": payload.get("order"),
        "family": payload.get("family"),
        "genus": payload.get("genus"),
        "accepted_usage_key": payload.get("acceptedUsageKey"),
        "source_url": f"https://www.gbif.org/species/{payload.get('key')}",
    }


def _gbif_occurrences(taxon_key: int) -> dict[str, Any]:
    params = {
        "taxonKey": str(taxon_key),
        "limit": "15",
        "offset": "0",
        "orderBy": "eventDate",
        "order": "DESC",
    }
    payload = _get_json("https://api.gbif.org/v1/occurrence/search?" + urlencode(params))
    rows = []
    for item in payload.get("results", []):
        rows.append({
            "occurrence_id": item.get("key"),
            "scientific_name": item.get("scientificName"),
            "country": item.get("country"),
            "country_code": item.get("countryCode"),
            "state_province": item.get("stateProvince"),
            "locality": item.get("locality"),
            "event_date": item.get("eventDate"),
            "year": item.get("year"),
            "record_type": item.get("basisOfRecord"),
            "dataset": item.get("datasetName"),
            "institution": item.get("institutionCode"),
            "collection": item.get("collectionCode"),
            "catalogue_number": item.get("catalogNumber"),
            "recorded_by": item.get("recordedBy"),
            "latitude": item.get("decimalLatitude"),
            "longitude": item.get("decimalLongitude"),
            "coordinate_uncertainty_m": item.get("coordinateUncertaintyInMeters"),
            "habitat_note": item.get("habitat"),
            "field_note": item.get("occurrenceRemarks"),
            "record_url": f"https://www.gbif.org/occurrence/{item.get('key')}" if item.get("key") else None,
        })
    return {"total_indexed_records": int(payload.get("count") or 0), "returned_records": len(rows), "records": rows}


def _wikidata(query: str) -> list[dict[str, Any]]:
    params = urlencode({
        "action": "wbsearchentities",
        "search": query,
        "language": "en",
        "format": "json",
        "type": "item",
        "limit": "5",
    })
    payload = _get_json("https://www.wikidata.org/w/api.php?" + params)
    return [
        {
            "id": item.get("id"),
            "label": item.get("label"),
            "description": item.get("description"),
            "url": item.get("concepturi"),
        }
        for item in payload.get("search", [])[:5]
    ]


def _crossref(query: str) -> list[dict[str, Any]]:
    params = urlencode({
        "query.bibliographic": query,
        "rows": "5",
        "select": "title,author,published,container-title,DOI,URL,type",
    })
    payload = _get_json("https://api.crossref.org/works?" + params)
    output = []
    for item in payload.get("message", {}).get("items", [])[:5]:
        title = (item.get("title") or [""])[0]
        if not title:
            continue
        date_parts = (item.get("published") or item.get("published-print") or {}).get("date-parts") or []
        year = date_parts[0][0] if date_parts and date_parts[0] else None
        authors = [
            " ".join(part for part in [author.get("given"), author.get("family")] if part)
            for author in item.get("author", [])[:4]
        ]
        output.append({
            "title": title,
            "authors": authors,
            "year": year,
            "publication": (item.get("container-title") or [""])[0],
            "doi": item.get("DOI"),
            "url": item.get("URL"),
            "record_type": item.get("type"),
            "verification": "Bibliographic metadata candidate; inspect the publisher record before citing.",
        })
    return output


def _section_insights(section: str, taxon: dict[str, Any] | None, occurrence_data: dict[str, Any]) -> list[dict[str, str]]:
    records = occurrence_data.get("records", [])
    total = occurrence_data.get("total_indexed_records", 0)
    countries = sorted({row["country"] for row in records if row.get("country")})
    datasets = sorted({row["dataset"] for row in records if row.get("dataset")})
    specimens = [row for row in records if row.get("record_type") == "PRESERVED_SPECIMEN"]
    georeferenced = [row for row in records if row.get("latitude") is not None and row.get("longitude") is not None]
    dated = [row for row in records if row.get("event_date") or row.get("year")]
    insights: list[dict[str, str]] = []

    if section == "biosphere":
        insights = [
            {"label": "Indexed occurrences", "value": f"{total:,} records in GBIF"},
            {"label": "Mapped sample", "value": f"{len(georeferenced)} of {len(records)} returned records have coordinates"},
            {"label": "Recorded countries", "value": ", ".join(countries[:8]) or "Not supplied in this sample"},
        ]
    elif section == "risk":
        missing = len(records) - len(georeferenced)
        insights = [
            {"label": "Observation coverage", "value": f"{total:,} indexed occurrence records"},
            {"label": "Coordinate gaps in sample", "value": f"{missing} of {len(records)} returned records lack coordinates"},
            {"label": "Coverage caveat", "value": "Record density and missing data are not an extinction-risk assessment."},
        ]
    elif section == "climate":
        insights = [
            {"label": "Date metadata", "value": f"{len(dated)} of {len(records)} returned records include a date or year"},
            {"label": "Locality metadata", "value": f"{sum(bool(row.get('locality') or row.get('state_province')) for row in records)} of {len(records)} include locality context"},
            {"label": "Environmental readiness", "value": "These are metadata-readiness signals only; no climate values or impacts are inferred."},
        ]
    elif section == "provenance":
        institutions = sorted({row["institution"] for row in records if row.get("institution")})
        insights = [
            {"label": "Preserved specimens", "value": f"{len(specimens)} in the returned sample"},
            {"label": "Institutions", "value": ", ".join(institutions[:8]) or "No institution codes supplied"},
            {"label": "Collections / datasets", "value": f"{len(datasets)} distinct dataset names in the returned sample"},
        ]
    elif section == "econetwork":
        insights = [
            {"label": "Country links", "value": ", ".join(countries[:10]) or "No country values supplied"},
            {"label": "Dataset connections", "value": f"{len(datasets)} datasets represented in this sample"},
            {"label": "Record types", "value": ", ".join(sorted({row['record_type'] for row in records if row.get('record_type')})) or "Not supplied"},
        ]
    elif section == "conservation":
        insights = [
            {"label": "Evidence coverage", "value": f"{total:,} indexed occurrence records"},
            {"label": "Georeferenced sample", "value": f"{len(georeferenced)} of {len(records)} returned records"},
            {"label": "Interpretation", "value": "Occurrence records do not determine conservation status. Consult an authoritative assessment separately."},
        ]
    elif section == "sustainability":
        insights = [
            {"label": "Observed record baseline", "value": f"{total:,} indexed records"},
            {"label": "Sample scope", "value": f"{len(records)} records retrieved for this query"},
            {"label": "Scenario boundary", "value": "This bridge supplies observations only; it does not forecast sustainability outcomes."},
        ]
    elif section == "specimen":
        insights = [
            {"label": "Accepted taxon", "value": (taxon or {}).get("scientific_name") or "No GBIF taxon match"},
            {"label": "Family / genus", "value": " / ".join(x for x in [(taxon or {}).get("family"), (taxon or {}).get("genus")] if x) or "Not available"},
            {"label": "Specimen records", "value": f"{len(specimens)} preserved specimens in returned sample"},
        ]
    elif section == "ethno":
        insights = [
            {"label": "Archive discovery", "value": "Bibliographic records are discovery leads, not proof of community practice."},
            {"label": "Stewardship", "value": "Verify attribution, community consent, licence and cultural context before reuse."},
            {"label": "Botanical identity", "value": (taxon or {}).get("scientific_name") or "No taxonomy match; verify the name manually"},
        ]
    else:
        insights = [
            {"label": "Taxonomy", "value": (taxon or {}).get("scientific_name") or "No confident GBIF taxon match"},
            {"label": "Occurrence sample", "value": f"{total:,} indexed records; {len(records)} records returned"},
            {"label": "Source coverage", "value": f"{len(datasets)} dataset names represented in the returned sample"},
        ]
    return insights


@router.post("/query")
async def research_query(payload: ResearchQuery, request: Request) -> dict[str, Any]:
    query = _clean_query(payload.query)
    section = payload.section.strip().lower()
    if section not in SECTION_NAMES:
        section = "general"
    if RESTRICTED_RESEARCH_TERMS.search(query):
        raise HTTPException(
            status_code=400,
            detail="This research bridge is limited to non-clinical botany, taxonomy, biodiversity, specimen provenance and ecological documentation.",
        )

    client = request.client.host if request.client else "unknown"
    _rate_limit(client)
    cache_key = section + ":" + query.casefold()
    cached = _cached(cache_key)
    if cached:
        return {**cached, "cached": True}

    try:
        taxon, wikidata, literature = await asyncio.gather(
            asyncio.to_thread(_gbif_taxon, query),
            asyncio.to_thread(_wikidata, query),
            asyncio.to_thread(_crossref, query),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    occurrence_data: dict[str, Any] = {"total_indexed_records": 0, "returned_records": 0, "records": []}
    if taxon and taxon.get("key"):
        try:
            occurrence_data = await asyncio.to_thread(_gbif_occurrences, int(taxon["key"]))
        except RuntimeError as exc:
            # Taxonomy and literature are still useful if occurrence retrieval is temporarily unavailable.
            occurrence_data["warning"] = str(exc)

    insights = _section_insights(section, taxon, occurrence_data)
    section_name = SECTION_NAMES[section]
    if taxon:
        overview = (
            f"GBIF matched “{query}” to {taxon.get('scientific_name')} "
            f"({taxon.get('rank') or 'taxonomic rank not supplied'}). "
            f"The occurrence index currently reports {occurrence_data.get('total_indexed_records', 0):,} records."
        )
    else:
        overview = (
            f"No confident GBIF taxonomy match was returned for “{query}”. "
            "The related knowledge and publication matches below are discovery candidates and need manual verification."
        )

    warnings = [
        "GBIF occurrence totals describe indexed records, not population size, abundance or a complete field census.",
        "Only the first 15 occurrence records are returned by this endpoint; use the GBIF portal for broader exploration.",
        "Wikidata and Crossref matches are discovery metadata. Verify the original source before citing or treating a statement as established.",
        "No scanned-document OCR, full-text article access, medical interpretation or clinical assessment is performed.",
    ]
    if occurrence_data.get("warning"):
        warnings.append(occurrence_data["warning"])
    if not taxon:
        warnings.append("A missing taxonomy match does not prove that the organism or common name is invalid.")

    result = {
        "schema_version": "1.0",
        "query": query,
        "section": section,
        "section_name": section_name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "overview": overview,
        "taxon": taxon,
        "section_insights": insights,
        "occurrence_summary": {
            "total_indexed_records": occurrence_data.get("total_indexed_records", 0),
            "returned_records": occurrence_data.get("returned_records", 0),
            "coordinate_backed_records": sum(1 for row in occurrence_data.get("records", []) if row.get("latitude") is not None and row.get("longitude") is not None),
            "preserved_specimens": sum(1 for row in occurrence_data.get("records", []) if row.get("record_type") == "PRESERVED_SPECIMEN"),
        },
        "occurrences": occurrence_data.get("records", []),
        "related_knowledge": wikidata,
        "literature_candidates": literature,
        "sources": [
            {"name": "GBIF Species API", "url": "https://api.gbif.org/v1/species/match", "purpose": "Taxonomic name matching and accepted-name resolution"},
            {"name": "GBIF Occurrence API", "url": "https://api.gbif.org/v1/occurrence/search", "purpose": "Indexed biodiversity occurrence and specimen records"},
            {"name": "Wikidata", "url": "https://www.wikidata.org/", "purpose": "Structured entity labels and short descriptions"},
            {"name": "Crossref", "url": "https://api.crossref.org/works", "purpose": "Bibliographic metadata discovery"},
        ],
        "warnings": warnings,
        "review_required": True,
        "cached": False,
    }
    _store_cache(cache_key, result)
    return result
