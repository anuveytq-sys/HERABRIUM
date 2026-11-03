from __future__ import annotations

from typing import Any
from fastapi import APIRouter, HTTPException, Query
from urllib.parse import quote

router = APIRouter(prefix="/api/v1/phytochem", tags=["PhytoChem"])

# Curated discovery records. Descriptors are approximate reference values for
# exploratory filtering; verify against primary databases before publication.
COMPOUNDS: list[dict[str, Any]] = [
 {"id":"curcumin","name":"Curcumin","formula":"C21H20O6","mass":368.38,"plant":"Curcuma longa","synonyms":["Diferuloylmethane"],"smiles":"COc1cc(/C=C/C(=O)CC(=O)/C=C/c2ccc(O)c(OC)c2)ccc1O","class":"Diarylheptanoid","logp":3.2,"hbd":2,"hba":6,"tpsa":93.1,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=curcumin","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=curcumin","note":"Well-studied turmeric constituent; this record is a literature-discovery entry, not an efficacy statement."},
 {"id":"demethoxycurcumin","name":"Demethoxycurcumin","formula":"C20H18O5","mass":338.36,"plant":"Curcuma longa","synonyms":["DMC"],"smiles":"COc1cc(/C=C/C(=O)CC(=O)/C=C/c2ccc(O)cc2)ccc1O","class":"Diarylheptanoid","logp":3.0,"hbd":2,"hba":5,"tpsa":82.3,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=demethoxycurcumin","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=demethoxycurcumin","note":"Curcuminoid analogue; occurrence and abundance depend on source and preparation."},
 {"id":"azadirachtin","name":"Azadirachtin","formula":"C35H44O16","mass":720.71,"plant":"Azadirachta indica","synonyms":["Azadirachtin A"],"smiles":"C","class":"Limonoid","logp":-0.5,"hbd":6,"hba":16,"tpsa":227.0,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=azadirachtin","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=azadirachtin","note":"Neem limonoid primarily documented in natural-products and agricultural literature."},
 {"id":"nimbin","name":"Nimbin","formula":"C30H36O9","mass":540.60,"plant":"Azadirachta indica","synonyms":[],"smiles":"C","class":"Limonoid","logp":3.1,"hbd":1,"hba":9,"tpsa":122.0,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=nimbin","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=nimbin","note":"Neem-associated limonoid; verify plant part and analytical identification in each paper."},
 {"id":"eugenol","name":"Eugenol","formula":"C10H12O2","mass":164.20,"plant":"Ocimum tenuiflorum","synonyms":["4-allyl-2-methoxyphenol"],"smiles":"COc1cc(CC=C)ccc1O","class":"Phenylpropanoid","logp":2.3,"hbd":1,"hba":2,"tpsa":29.5,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=eugenol","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=eugenol","note":"Aromatic phenylpropanoid reported in multiple botanical sources; chemotype varies."},
 {"id":"ursolic-acid","name":"Ursolic acid","formula":"C30H48O3","mass":456.70,"plant":"Ocimum tenuiflorum","synonyms":["Urson","Prunol"],"smiles":"C","class":"Pentacyclic triterpenoid","logp":7.3,"hbd":2,"hba":3,"tpsa":57.5,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=ursolic%20acid","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=ursolic+acid","note":"Pentacyclic triterpenoid reported across many species; source attribution requires checking."},
 {"id":"withaferin-a","name":"Withaferin A","formula":"C28H38O6","mass":470.60,"plant":"Withania somnifera","synonyms":["Withaferin-A"],"smiles":"C","class":"Withanolide","logp":2.8,"hbd":2,"hba":6,"tpsa":96.4,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=withaferin%20A","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=withaferin+A","note":"Steroidal lactone in withanolide research; compound identity should be confirmed analytically."},
 {"id":"rosmarinic-acid","name":"Rosmarinic acid","formula":"C18H16O8","mass":360.31,"plant":"Ocimum tenuiflorum","synonyms":[],"smiles":"O=C(O)C(Cc1ccc(O)c(O)c1)OC(=O)/C=C/c1ccc(O)c(O)c1","class":"Phenolic ester","logp":2.4,"hbd":5,"hba":8,"tpsa":144.5,"source":"https://pubchem.ncbi.nlm.nih.gov/#query=rosmarinic%20acid","pm":"https://pubmed.ncbi.nlm.nih.gov/?term=rosmarinic+acid","note":"Polyphenolic ester discussed in phytochemical profiling literature."}
]
PLANT_MAP = {
 "Curcuma longa":["curcumin","demethoxycurcumin"],
 "Azadirachta indica":["azadirachtin","nimbin"],
 "Ocimum tenuiflorum":["eugenol","ursolic-acid","rosmarinic-acid"],
 "Withania somnifera":["withaferin-a"],
}
def _public(c: dict[str, Any]) -> dict[str, Any]:
 return {**c,"prediction_status":"Reference descriptor / literature discovery only","evidence_status":"Curated starter record — verify source-level occurrence"}
@router.get("/catalog")
def catalog() -> dict[str, Any]:
 return {"compounds":[_public(c) for c in COMPOUNDS],"plants":list(PLANT_MAP),"disclaimer":"Starter catalogue; not a complete phytochemical inventory or clinical evidence database."}
@router.get("/plant/{scientific_name:path}")
def plant_compounds(scientific_name: str) -> dict[str, Any]:
 matches=[_public(c) for c in COMPOUNDS if c["plant"].casefold()==scientific_name.casefold()]
 if not matches: raise HTTPException(404,"No starter compound links for this plant. This does not mean the species has no known compounds.")
 return {"plant":scientific_name,"relationships":matches,"relationship_status":"Literature-discovery candidates; verify each plant–compound link in primary sources."}
@router.post("/compare")
def compare(payload: dict[str, Any]) -> dict[str, Any]:
 ids=payload.get("compound_ids",[])
 if not isinstance(ids,list) or len(ids)<2 or len(ids)>4: raise HTTPException(400,"Select between two and four compound IDs.")
 chosen=[c for c in COMPOUNDS if c["id"] in ids]
 if len(chosen)!=len(set(ids)): raise HTTPException(404,"One or more compound IDs were not found.")
 rows=[]
 for a in chosen:
  for b in chosen:
   if a["id"]>=b["id"]: continue
   keys=["mass","logp","hbd","hba","tpsa"]
   delta={k:round(abs(float(a[k])-float(b[k])),3) for k in keys}
   rows.append({"a":a["name"],"b":b["name"],"absolute_descriptor_differences":delta,"shared_class":a["class"]==b["class"]})
 return {"compounds":[_public(c) for c in chosen],"pairwise":rows,"method":"Absolute differences across approximate catalogue descriptors; not a validated bioactivity or structural-similarity model.","review_required":True}
@router.get("/screen")
def screen(max_mass: float=Query(800,ge=100,le=1500),max_logp: float=Query(6,ge=-5,le=15),max_tpsa: float=Query(180,ge=0,le=300),compound_class: str="All") -> dict[str, Any]:
 rows=[_public(c) for c in COMPOUNDS if c["mass"]<=max_mass and c["logp"]<=max_logp and c["tpsa"]<=max_tpsa and (compound_class=="All" or c["class"]==compound_class)]
 return {"results":rows,"criteria":{"max_mass":max_mass,"max_logp":max_logp,"max_tpsa":max_tpsa,"class":compound_class},"method":"Reproducible rule-based descriptor filter over the included starter catalogue; not docking, ADMET, potency or safety prediction."}
@router.get("/research/{compound_id}")
def research(compound_id: str) -> dict[str, Any]:
 c=next((x for x in COMPOUNDS if x["id"]==compound_id),None)
 if not c: raise HTTPException(404,"Compound not found.")
 return {"compound":c["name"],"links":[{"label":"PubMed literature search","url":c["pm"],"type":"literature discovery"},{"label":"PubChem compound search","url":c["source"],"type":"chemical identity discovery"}],"assistant_mode":"Cited research navigator — search links only; no generated scientific conclusions."}
