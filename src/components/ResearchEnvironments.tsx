import { useState } from "react";
import { Activity, AlertTriangle, Atom, CheckCircle2, ChevronRight, ExternalLink, Globe2, Leaf, LoaderCircle, Network, Search, ShieldCheck, Sparkles, X } from "lucide-react";
type Mode="gbif"|"pubmed"|"pubchem"|"trials";
type Env={id:string;name:string;track:string;mode:Mode;desc:string;features:string[]};
const raw:[string,string,string,Mode,string][]=[
["ethnomemory","EthnoMemory","01 / TRADITIONAL KNOWLEDGE","pubmed","Historical terminology and ethnobotanical publication discovery."],
["crossculture","Cross-Cultural Knowledge Intelligence","01 / TRADITIONAL KNOWLEDGE","pubmed","Compare published knowledge records while retaining cultural attribution."],
["manuscript","Manuscript Intelligence Scanner","01 / TRADITIONAL KNOWLEDGE","pubmed","Discover source publications; use Document Lab for actual file extraction."],
["provenance","Knowledge Provenance Network","01 / TRADITIONAL KNOWLEDGE","pubmed","Trace publication metadata and source lineage."],
["confidence","EthnoKnowledge Confidence Engine","01 / TRADITIONAL KNOWLEDGE","pubmed","Inspect source discovery and metadata completeness without inventing trust scores."],
["preservation","Knowledge Preservation Observatory","01 / TRADITIONAL KNOWLEDGE","gbif","Resolve taxonomic identities and occurrence coverage."],
["molecule","PhytoMolecule 3D Studio","02 / NATURAL PRODUCTS","pubchem","Retrieve compound identities and descriptors; existing PhytoChem has a 3D molecular view."],
["relationships","Compound Relationship Intelligence","02 / NATURAL PRODUCTS","pubmed","Discover literature about plant–compound relationships."],
["sandbox","Computational Research Sandbox","02 / NATURAL PRODUCTS","pubchem","Use live compound properties as reproducible research inputs."],
["priority","PhytoDiscovery Prioritisation","02 / NATURAL PRODUCTS","pubmed","Find literature leads and transparent research-priority gaps."],
["targets","Scientific Target Relationship Explorer","02 / NATURAL PRODUCTS","pubmed","Search publications reporting compound and biological-target relationships."],
["repro","Research Reproducibility Laboratory","02 / NATURAL PRODUCTS","pubchem","Repeat compound lookups and preserve source identifiers."],
["biosphere","BioSphere 3D & Biodiversity Explorer","03 / BIODIVERSITY","gbif","Resolve accepted names and retrieve actual georeferenced occurrence records."],
["risk","Biodiversity Risk Observatory","03 / BIODIVERSITY","gbif","Inspect occurrence coverage and data provenance; not extinction risk."],
["climate","Climate Impact Intelligence","03 / BIODIVERSITY","gbif","Inspect georeferenced occurrence readiness for later environmental analysis."],
["botanical","Botanical Provenance Tracker","03 / BIODIVERSITY","gbif","Inspect collection and occurrence record provenance; not supply-chain authentication."],
["econetwork","EcoNetwork Intelligence","03 / BIODIVERSITY","gbif","Explore species, region and dataset relationships from occurrence metadata."],
["conservation","Conservation Priority Dashboard","03 / BIODIVERSITY","gbif","Surface taxonomic and occurrence evidence; threat categories require a verified conservation source."],
["sustainability","Sustainability Research Simulator","03 / BIODIVERSITY","gbif","Explore data readiness for clearly labelled hypothetical scenarios."],
["evidence","PhytoEvidence 360","04 / DIGITAL HEALTH & PHYTOTHERAPY","pubmed","Retrieve real biomedical publications for human evidence review."],
["matrix","Evidence Comparison Matrix","04 / DIGITAL HEALTH & PHYTOTHERAPY","pubmed","Compare publication metadata and study context through source links."],
["clinical","Clinical Research Observatory","04 / DIGITAL HEALTH & PHYTOTHERAPY","trials","Search registered clinical study records."],
["copilot","PhytoResearch Copilot","04 / DIGITAL HEALTH & PHYTOTHERAPY","pubmed","Source-grounded literature navigator; no generated treatment advice."],
["timeline","Research Evidence Timeline","04 / DIGITAL HEALTH & PHYTOTHERAPY","pubmed","Explore publication dates and original indexed records."],
["claim","Scientific Claim Verification","04 / DIGITAL HEALTH & PHYTOTHERAPY","pubmed","Find supporting or conflicting literature leads for manual verification."],
["discovery","HERBARIUM Discovery Engine","05 / CROSS-DOMAIN INTELLIGENCE","pubmed","Connect literature discovery with taxonomy, biodiversity and compound workspaces."],
["gaps","Research Gap Intelligence","05 / CROSS-DOMAIN INTELLIGENCE","pubmed","Identify missing data fields and under-documented relationships in returned records."],
["identity","Botanical Identity Resolution","05 / CROSS-DOMAIN INTELLIGENCE","gbif","Resolve scientific names and accepted taxonomy using GBIF."],
["impact","Research Impact Analytics","05 / CROSS-DOMAIN INTELLIGENCE","pubmed","Summarise query-dependent publication metadata, not scientific impact rankings."],
["quality","Data Quality Observatory","05 / CROSS-DOMAIN INTELLIGENCE","gbif","Inspect occurrence metadata completeness and missing fields."],
["report","Scientific Report Generator","05 / CROSS-DOMAIN INTELLIGENCE","pubmed","Prepare a source-linked literature brief from actual retrieved records."]
];
const envs:Env[]=raw.map(x=>({id:x[0],name:x[1],track:x[2],mode:x[3],desc:x[4],features:["Live public database lookup","Source-linked original records","Uncertainty and missing-data visibility","Export-ready research trail"]}));
type RecordItem={title:string;sub:string;detail:string;url:string;id:string};
async function queryData(e:Env,q:string):Promise<{items:RecordItem[];summary:string;source:string}>{
 if(!q.trim())throw new Error("Enter a plant, compound or research topic.");
 if(e.mode==="gbif"){
  const a=await fetch("https://api.gbif.org/v1/species/match?name="+encodeURIComponent(q));if(!a.ok)throw new Error("GBIF taxonomic service unavailable.");
  const t=await a.json();if(!t.scientificName)throw new Error("No GBIF taxonomic match. Try the accepted scientific name.");
  const b=await fetch("https://api.gbif.org/v1/occurrence/search?scientificName="+encodeURIComponent(t.scientificName)+"&limit=8");if(!b.ok)throw new Error("GBIF occurrence service unavailable.");
  const o=await b.json();const items:RecordItem[]=(o.results||[]).map((r:any)=>({title:r.scientificName||t.scientificName,sub:[r.country,r.eventDate,r.basisOfRecord].filter(Boolean).join(" · "),detail:[r.datasetName,r.institutionCode,r.decimalLatitude!=null?"Coordinates "+r.decimalLatitude+", "+r.decimalLongitude:"Coordinates not supplied"].filter(Boolean).join(" — "),url:r.references||"https://www.gbif.org/occurrence/"+r.key,id:"GBIF occurrence "+r.key}));
  return {items,summary:"Taxon match: "+t.scientificName+" ("+(t.rank||"rank unavailable")+"). GBIF reports "+(o.count??items.length)+" matching occurrence records; showing "+items.length+". Occurrences are not abundance or conservation status.",source:"GBIF Species API + Occurrence API"};
 }
 if(e.mode==="pubchem"){
  const r=await fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"+encodeURIComponent(q)+"/property/MolecularFormula,MolecularWeight,IUPACName/JSON");if(!r.ok)throw new Error("No PubChem compound record returned.");
  const d=await r.json();const rows=d.PropertyTable?.Properties||[];return {items:rows.slice(0,8).map((p:any)=>({title:"PubChem CID "+p.CID,sub:(p.MolecularFormula||"Formula unavailable")+" · "+(p.MolecularWeight||"Mass unavailable")+" g/mol",detail:p.IUPACName||"IUPAC name unavailable",url:"https://pubchem.ncbi.nlm.nih.gov/compound/"+p.CID,id:"PubChem CID "+p.CID})),summary:"PubChem returned "+rows.length+" chemical identity record(s). Chemical descriptors do not establish biological activity, safety or therapeutic effect.",source:"PubChem PUG REST"};
 }
 if(e.mode==="trials"){
  const r=await fetch("https://clinicaltrials.gov/api/v2/studies?query.term="+encodeURIComponent(q)+"&pageSize=8&format=json");if(!r.ok)throw new Error("ClinicalTrials.gov API unavailable.");
  const d=await r.json();const rows=d.studies||[];return {items:rows.map((s:any)=>{const p=s.protocolSection||{},i=p.identificationModule||{},st=p.statusModule||{};return {title:i.briefTitle||"Registered study",sub:[i.nctId,st.overallStatus].filter(Boolean).join(" · "),detail:p.descriptionModule?.briefSummary||"No brief summary supplied",url:"https://clinicaltrials.gov/study/"+i.nctId,id:"ClinicalTrials.gov "+i.nctId};}),summary:"Registry returned "+(d.totalCount??rows.length)+" study record(s). Registration is not proof of effectiveness.",source:"ClinicalTrials.gov API v2"};
 }
 const r=await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term="+encodeURIComponent(q)+"&retmode=json&retmax=8");if(!r.ok)throw new Error("NCBI PubMed search unavailable.");
 const d=await r.json();const ids=d.esearchresult?.idlist||[];if(!ids.length)return {items:[],summary:"No indexed records found. Try a broader phrase or scientific synonym.",source:"NCBI E-utilities / PubMed"};
 const s=await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id="+ids.join(",")+"&retmode=json");if(!s.ok)throw new Error("PubMed metadata retrieval failed.");const z=await s.json();
 return {items:ids.map((id:string)=>{const p=z.result?.[id]||{};return {title:p.title||"Untitled indexed record",sub:[p.pubdate,p.fulljournalname].filter(Boolean).join(" · "),detail:(p.authors||[]).slice(0,4).map((a:any)=>a.name).join(", ")||"Author metadata unavailable",url:"https://pubmed.ncbi.nlm.nih.gov/"+id+"/",id:"PMID "+id};}),summary:"PubMed returned "+(d.esearchresult?.count||ids.length)+" indexed result(s); showing "+ids.length+". Search relevance is not evidence strength. Review original methods, results and limitations.",source:"NCBI E-utilities / PubMed"};
}
export default function ResearchEnvironments({onClose}:{onClose:()=>void}){
 const [active,setActive]=useState<Env|null>(null),[q,setQ]=useState("Curcuma longa"),[busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<{items:RecordItem[];summary:string;source:string}|null>(null);
 const tracks=Array.from(new Set(envs.map(e=>e.track)));
 async function run(){if(!active)return;setBusy(true);setError("");setResult(null);try{setResult(await queryData(active,q));}catch(e){setError(e instanceof Error?e.message:"Live lookup failed.");}finally{setBusy(false);}}
 function choose(e:Env){setActive(e);setQ(e.mode==="pubchem"?"curcumin":e.mode==="trials"?"curcumin":"Curcuma longa");setResult(null);setError("");}
 return <div className="env-overlay" role="dialog" aria-modal="true" aria-label="Research environments"><div className="env-shell">
 <header className="env-top"><div className="env-brand"><span className="env-mark"><Leaf/></span><div><b>HERBARIUM / NEXUS</b><small>INDEPENDENT SCIENTIFIC ENVIRONMENTS</small></div></div><span className="env-live"><i/> LIVE PUBLIC DATA</span><button className="icon-button" onClick={onClose} aria-label="Close"><X/></button></header>
 {!active?<div className="env-directory"><div className="env-intro"><span className="eyebrow">SYSTEM DIRECTORY / SCIENTIFIC INTELLIGENCE</span><h2>Enter a research <em>universe.</em></h2><p>Choose an independent environment. Live records are fetched from public scientific databases, not generated sample data.</p><div className="env-orbit"><div/><div/><div/><Dna/><span>HERBARIUM<br/>INTELLIGENCE</span></div></div>
 {tracks.map((t,i)=><section className="env-group" key={t}><div className="env-group-title"><b>0{i+1}</b><i/>{t}</div><div className="env-grid">{envs.filter(e=>e.track===t).map((e,j)=><button className="env-card" key={e.id} onClick={()=>choose(e)}><div className="env-card-top"><span>ENVIRONMENT / {String(j+1).padStart(2,"0")}</span><ChevronRight/></div><div className="env-icon">{e.mode==="gbif"?<Globe2/>:e.mode==="pubchem"?<Atom/>:e.mode==="trials"?<Activity/>:<Network/>}</div><h3>{e.name}</h3><p>{e.desc}</p><div className="env-card-foot"><span>{e.mode==="gbif"?"GBIF":e.mode==="pubchem"?"PUBCHEM":e.mode==="trials"?"CLINICALTRIALS.GOV":"PUBMED / NCBI"}</span><span>OPEN <ExternalLink size={12}/></span></div></button>)}</div></section>)}
 <div className="env-ethics"><ShieldCheck/><div><b>Evidence before assertion</b><span>Traditional knowledge requires attribution and permission. Database hits are evidence leads, not medical advice, efficacy claims or safety recommendations.</span></div></div></div>
 :<div className="env-work"><button className="env-back" onClick={()=>setActive(null)}>← ALL ENVIRONMENTS</button><div className="env-work-title"><div><span className="eyebrow">{active.track} / LIVE WORKSPACE</span><h2>{active.name}</h2><p>{active.desc}</p></div><div className="env-sigil"><div/><div/><Atom/></div></div><div className="env-features">{active.features.map(x=><span key={x}><CheckCircle2/>{x}</span>)}</div>
 <div className="env-query"><label><Search/> LIVE DATABASE QUERY <small>{active.mode==="gbif"?"GBIF":active.mode==="pubchem"?"PubChem":active.mode==="trials"?"ClinicalTrials.gov":"PubMed / NCBI"}</small></label><div><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} placeholder="Enter plant, compound or research topic"/><button className="button button-primary" disabled={busy} onClick={run}>{busy?<LoaderCircle className="spin"/>:<Search/>}{busy?"QUERYING":"RUN QUERY"}</button></div><small>Request goes directly to the named public database. No paid API key required.</small></div>
 {error&&<div className="env-error"><AlertTriangle/>{error}</div>}
 {result&&<div className="env-results"><span className="eyebrow">SOURCE RESPONSE / {result.source}</span><h3>{result.items.length} returned records</h3><p className="env-summary">{result.summary}</p>{result.items.map((r,i)=><article className="env-record" key={r.id+i}><b>{String(i+1).padStart(2,"0")}</b><div><h4>{r.title}</h4><span>{r.sub}</span><p>{r.detail}</p><small>{r.id}</small></div><a href={r.url} target="_blank" rel="noreferrer"><ExternalLink/></a></article>)}{!result.items.length&&<p className="env-summary">No records returned. Try a synonym or broader query.</p>}</div>}
 {!result&&!error&&<div className="env-wait"><div><Sparkles/></div><b>Environment initialised</b><span>Run a query to retrieve original source records.</span></div>}
 <div className="env-footnote"><ShieldCheck/> {active.mode==="gbif"?"GBIF occurrence records may be incomplete, duplicated or lack coordinates; counts are not abundance or threat status.":active.mode==="pubchem"?"Chemical descriptors do not establish biological activity, safety or therapeutic effect.":active.mode==="trials"?"Registry entries are not proof of successful outcomes; inspect protocol and published results.":"PubMed search matches are not evidence grades. Read original papers and assess study design and limitations."}</div></div>}
 <footer className="env-footer"><span>HERBARIUM INTELLIGENCE NETWORK</span><span>PUBLIC DATA · SOURCE FIRST · HUMAN REVIEW</span><span>NO PAID API KEY REQUIRED</span></footer></div></div>;
}
