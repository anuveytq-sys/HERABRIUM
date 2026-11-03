import { useState } from "react";
import { Activity, AlertTriangle, Atom, CheckCircle2, ChevronRight, ExternalLink, Globe2, Leaf, LoaderCircle, Network, Search, ShieldCheck, Sparkles, X } from "lucide-react";
type Mode="gbif"|"pubmed"|"pubchem"|"trials";
type Env={id:string;name:string;track:string;mode:Mode;desc:string;features:string[];task:string};
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
const taskPlans:Record<string,{task:string;terms:string;hint:string}>={
 ethnomemory:{task:"Historical ethnobotanical knowledge discovery",terms:"(ethnobotany OR ethnomedicine OR traditional medicine) AND",hint:"Add a plant, community, region, historical name or traditional-use topic."},
 crossculture:{task:"Cross-cultural publication comparison",terms:"(ethnobotany OR ethnomedicine OR traditional knowledge) AND",hint:"Search a plant plus a culture, language, country or region."},
 manuscript:{task:"Manuscript and publication source discovery",terms:"(ethnobotany OR medicinal plant OR botanical) AND",hint:"Search a manuscript title, author, DOI, plant or subject. Upload/OCR is handled in Document Lab."},
 provenance:{task:"Publication provenance and citation tracing",terms:"(medicinal plant OR ethnobotany OR phytochemistry) AND",hint:"Search a paper title, author, DOI, plant or research phrase."},
 confidence:{task:"Source coverage and metadata confidence audit",terms:"(medicinal plant OR ethnobotany OR phytochemistry) AND",hint:"Search a subject; inspect returned source coverage and metadata completeness."},
 preservation:{task:"Taxonomic coverage and under-documented species discovery",terms:"",hint:"Search any accepted or common organism name."},
 molecule:{task:"Chemical identity and molecular descriptor inspection",terms:"",hint:"Search a compound name, synonym, formula or PubChem CID."},
 relationships:{task:"Plant–compound relationship literature discovery",terms:"(phytochemical OR plant compound OR natural product OR isolated compound) AND",hint:"Search a plant, compound or compound class."},
 sandbox:{task:"Reproducible chemical descriptor analysis",terms:"",hint:"Search a compound name or PubChem CID to retrieve reproducible descriptors."},
 priority:{task:"Research prioritisation and literature-density scan",terms:"(medicinal plant OR phytochemistry OR ethnobotany) AND",hint:"Search a species, compound or research question."},
 targets:{task:"Compound–protein and biological target literature",terms:"(molecular target OR protein target OR enzyme OR receptor OR bioactivity) AND",hint:"Search a compound, target protein, enzyme or organism."},
 repro:{task:"Chemical record reproducibility and identifier check",terms:"",hint:"Search a compound name or CID; retain the returned PubChem identifier."},
 biosphere:{task:"Species occurrence and geographic distribution mapping",terms:"",hint:"Search any organism's scientific or common name."},
 risk:{task:"Biodiversity observation coverage and data-gap audit",terms:"",hint:"Search a species; this measures observation coverage, not extinction risk."},
 climate:{task:"Georeferenced occurrence readiness for environmental analysis",terms:"",hint:"Search a species to inspect dated and georeferenced records."},
 botanical:{task:"Collection event and specimen provenance inspection",terms:"",hint:"Search a species to inspect institution, collection date and record basis."},
 econetwork:{task:"Species–region–dataset ecological relationship discovery",terms:"",hint:"Search an organism to inspect its occurrence regions and source datasets."},
 conservation:{task:"Conservation evidence readiness and occurrence review",terms:"",hint:"Search a species; official threat categories require a separate conservation authority."},
 sustainability:{task:"Biodiversity baseline for hypothetical sustainability scenarios",terms:"",hint:"Search a species to establish an occurrence-data baseline."},
 evidence:{task:"Biomedical evidence retrieval and study-context review",terms:"(clinical OR trial OR observational OR in vitro OR animal OR systematic review) AND",hint:"Search a plant, compound, condition or research question; assess study type manually."},
 matrix:{task:"Publication comparison by date, journal and study context",terms:"(medicinal plant OR phytotherapy OR phytochemical) AND",hint:"Search a topic; compare the original papers and their methods."},
 clinical:{task:"Registered human research study discovery",terms:"",hint:"Search a plant, compound, intervention or research condition."},
 copilot:{task:"Source-grounded biomedical literature navigation",terms:"(medicinal plant OR phytotherapy OR phytochemical OR natural product) AND",hint:"Ask about a plant, compound or research topic; results are source leads, not generated advice."},
 timeline:{task:"Publication chronology and research evolution",terms:"(medicinal plant OR ethnobotany OR phytochemistry) AND",hint:"Search a species, compound or topic to inspect publication dates."},
 claim:{task:"Scientific claim literature cross-check",terms:"(medicinal plant OR phytochemical OR natural product) AND",hint:"Enter a concise scientific claim or topic to find relevant literature for human review."},
 discovery:{task:"Cross-domain plant, compound and evidence discovery",terms:"(medicinal plant OR ethnobotany OR phytochemistry OR biodiversity) AND",hint:"Search a species, compound or broad biological research topic."},
 gaps:{task:"Missing relationship and research coverage analysis",terms:"(medicinal plant OR ethnobotany OR phytochemistry) AND",hint:"Search a topic; gaps are inferred only from returned search coverage, not all global science."},
 identity:{task:"Accepted-name resolution and taxonomic synonym inspection",terms:"",hint:"Search any organism name, synonym or taxonomic phrase."},
 impact:{task:"Publication activity and research-output analytics",terms:"(medicinal plant OR phytochemistry OR ethnobotany) AND",hint:"Search a topic to analyse returned publication dates and journals, not citation impact."},
 quality:{task:"Occurrence metadata completeness and quality audit",terms:"",hint:"Search a species to inspect coordinate, date, basis and institution completeness."},
 report:{task:"Source-linked research brief assembly",terms:"(medicinal plant OR phytochemistry OR ethnobotany OR biodiversity) AND",hint:"Search a research question or organism to assemble a traceable source brief."}
};
const envs:Env[]=raw.map(x=>({id:x[0],name:x[1],track:x[2],mode:x[3],desc:x[4],task:taskPlans[x[0]].task,features:[taskPlans[x[0]].task,"Task-specific search strategy","Original source-linked records","Visible uncertainty and missing data"]}));
type RecordItem={title:string;sub:string;detail:string;url:string;id:string};
async function queryData(e:Env,q:string):Promise<{items:RecordItem[];summary:string;source:string}>{
 if(!q.trim())throw new Error("Enter a plant, compound or research topic.");
 if(e.mode==="gbif"){
  const a=await fetch("https://api.gbif.org/v1/species/match?name="+encodeURIComponent(q));if(!a.ok)throw new Error("GBIF taxonomic service unavailable.");
  const t=await a.json();if(!t.scientificName)throw new Error("No GBIF taxonomic match. Try the accepted scientific name.");
  const filters:Record<string,string>={risk:"&hasCoordinate=true",climate:"&hasCoordinate=true&hasGeospatialIssue=false",botanical:"&basisOfRecord=PRESERVED_SPECIMEN",econetwork:"&hasCoordinate=true",conservation:"&hasCoordinate=true",sustainability:"&hasCoordinate=true",quality:"&hasCoordinate=true"};\n  const b=await fetch("https://api.gbif.org/v1/occurrence/search?scientificName="+encodeURIComponent(t.scientificName)+(filters[e.id]||"")+"&limit=8");if(!b.ok)throw new Error("GBIF occurrence service unavailable.");
  const o=await b.json();const items:RecordItem[]=(o.results||[]).map((r:any)=>({title:r.scientificName||t.scientificName,sub:[r.country,r.eventDate,r.basisOfRecord].filter(Boolean).join(" · "),detail:[r.datasetName,r.institutionCode,r.decimalLatitude!=null?"Coordinates "+r.decimalLatitude+", "+r.decimalLongitude:"Coordinates not supplied"].filter(Boolean).join(" — "),url:r.references||"https://www.gbif.org/occurrence/"+r.key,id:"GBIF occurrence "+r.key}));
  const count=o.count??items.length;
  const summaries:Record<string,string>={
   preservation:"Preservation coverage: "+count+" GBIF occurrence records are indexed for this taxon; inspect geographic and temporal gaps before proposing digitisation priorities.",
   biosphere:"Distribution layer: "+count+" occurrence records found; "+items.filter(x=>x.detail.includes("Coordinates ")).length+" of the displayed records include coordinates for mapping.",
   risk:"Observation coverage audit: "+count+" coordinate-bearing records returned. This is a data-coverage signal only, not an extinction-risk assessment.",
   climate:"Environmental-analysis readiness: "+items.filter(x=>x.sub).length+" returned records include date or locality context. Climate variables are not inferred by this panel.",
   botanical:"Specimen provenance: "+items.filter(x=>x.sub.includes("PRESERVED_SPECIMEN")).length+" of the displayed records are preserved specimens. Institution and collection metadata should be checked record by record.",
   econetwork:"Ecological connection scan: "+new Set(items.map(x=>x.sub.split(" · ")[0]).filter(Boolean)).size+" distinct locality labels appear in the displayed records.",
   conservation:"Conservation evidence readiness: "+count+" coordinate-bearing observations found. No threat category is assigned without an authoritative conservation assessment.",
   sustainability:"Scenario baseline: "+count+" coordinate-bearing occurrence records provide an observational starting point; no future sustainability outcome is predicted.",
   identity:"Identity resolution: accepted name "+t.scientificName+", rank "+(t.rank||"not supplied")+", match confidence "+(t.confidence??"not supplied")+". Review synonyms and taxonomic status at the source.",
   quality:"Metadata audit: "+items.filter(x=>x.sub&&x.detail).length+" of "+items.length+" displayed records contain both locality/date and dataset/institution context."
  };
  return {items,summary:(summaries[e.id]||("Taxon match: "+t.scientificName+" ("+(t.rank||"rank unavailable")+"). "+count+" occurrence records found."))+" Occurrence counts are not abundance or conservation status.",source:"GBIF Species API + Occurrence API"};
 }
 if(e.mode==="pubchem"){
  const r=await fetch("https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"+encodeURIComponent(q)+"/property/MolecularFormula,MolecularWeight,IUPACName/JSON");if(!r.ok)throw new Error("No PubChem compound record returned.");
  const d=await r.json();const rows=d.PropertyTable?.Properties||[];return {items:rows.slice(0,8).map((p:any)=>({title:"PubChem CID "+p.CID,sub:(p.MolecularFormula||"Formula unavailable")+" · "+(p.MolecularWeight||"Mass unavailable")+" g/mol",detail:p.IUPACName||"IUPAC name unavailable",url:"https://pubchem.ncbi.nlm.nih.gov/compound/"+p.CID,id:"PubChem CID "+p.CID})),summary:"PubChem returned "+rows.length+" chemical identity record(s). Chemical descriptors do not establish biological activity, safety or therapeutic effect.",source:"PubChem PUG REST"};
 }
 if(e.mode==="trials"){
  const r=await fetch("https://clinicaltrials.gov/api/v2/studies?query.term="+encodeURIComponent(q)+"&pageSize=8&format=json");if(!r.ok)throw new Error("ClinicalTrials.gov API unavailable.");
  const d=await r.json();const rows=d.studies||[];return {items:rows.map((s:any)=>{const p=s.protocolSection||{},i=p.identificationModule||{},st=p.statusModule||{};return {title:i.briefTitle||"Registered study",sub:[i.nctId,st.overallStatus].filter(Boolean).join(" · "),detail:p.descriptionModule?.briefSummary||"No brief summary supplied",url:"https://clinicaltrials.gov/study/"+i.nctId,id:"ClinicalTrials.gov "+i.nctId};}),summary:"Registry returned "+(d.totalCount??rows.length)+" study record(s). Registration is not proof of effectiveness.",source:"ClinicalTrials.gov API v2"};
 }
 const r=await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term="+encodeURIComponent(scopedQuery)+"&retmode=json&retmax=8");if(!r.ok)throw new Error("NCBI PubMed search unavailable.");
 const d=await r.json();const ids=d.esearchresult?.idlist||[];if(!ids.length)return {items:[],summary:"No indexed records found. Try a broader phrase or scientific synonym.",source:"NCBI E-utilities / PubMed"};
 const s=await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id="+ids.join(",")+"&retmode=json");if(!s.ok)throw new Error("PubMed metadata retrieval failed.");const z=await s.json();
 const records=ids.map((id:string)=>{const p=z.result?.[id]||{};return {title:p.title||"Untitled indexed record",sub:[p.pubdate,p.fulljournalname].filter(Boolean).join(" · "),detail:(p.authors||[]).slice(0,4).map((a:any)=>a.name).join(", ")||"Author metadata unavailable",url:"https://pubmed.ncbi.nlm.nih.gov/"+id+"/",id:"PMID "+id};});
 const dated=records.map(x=>({year:Number((x.sub.match(/\\b(19|20)\\d{2}\\b/)||[])[0]||0),journal:x.sub.split(" · ").slice(1).join(" · ")}));
 const journals=new Set(dated.map(x=>x.journal).filter(Boolean));
 const metadataComplete=records.filter(x=>x.title&&x.sub&&x.detail!=="Author metadata unavailable").length;
 const taskSummaries:Record<string,string>={
  ethnomemory:"Ethnobotanical archive scan: retrieved records are filtered toward ethnobotany, ethnomedicine and traditional medicine. Historical meaning still requires reading the full text.",
  crossculture:"Cross-cultural comparison set: "+journals.size+" journal titles represented in this result sample. Compare geographic and cultural context in the original papers; do not merge traditions into one claim.",
  manuscript:"Manuscript source discovery: "+records.length+" PubMed records found as possible source documents. This does not OCR or extract an uploaded manuscript; use Document Lab for file processing.",
  provenance:"Citation provenance: "+records.length+" PMID source identifiers resolved. Open each source to verify authorship, DOI, publisher and original publication details.",
  confidence:"Metadata completeness audit: "+metadataComplete+" of "+records.length+" returned records include title, date/journal and author metadata. This is record completeness, not scientific trust or efficacy.",
  relationships:"Plant–compound literature leads: results are scoped toward phytochemicals, natural products and isolated compounds. Confirm each plant-compound link in the full text.",
  priority:"Research prioritisation snapshot: "+(d.esearchresult?.count||ids.length)+" indexed matches reported; use this as a literature-density lead, not a quality ranking or proof that a topic is neglected.",
  targets:"Biological target literature: results are scoped toward proteins, enzymes, receptors and molecular targets. Confirm experimental target evidence and assay context in each paper.",
  evidence:"Evidence retrieval: records are scoped toward clinical, observational, laboratory and review terminology. Study design and evidence strength must be assessed from the full paper.",
  matrix:"Evidence comparison: "+journals.size+" distinct journal titles appear in the displayed sample across "+new Set(dated.map(x=>x.year).filter(Boolean)).size+" publication years. Compare methods and populations manually.",
  copilot:"Research copilot source set: "+records.length+" indexed papers retrieved for source-grounded reading. This panel retrieves literature; it does not generate treatment guidance.",
  timeline:"Publication timeline: "+(dated.map(x=>x.year).filter(Boolean).sort((a,b)=>a-b).join(", ")||"No publication years supplied")+". Dates are taken from PubMed metadata.",
  claim:"Claim cross-check: "+records.length+" relevant literature leads found. This search cannot establish a claim as true or false; inspect supporting and contradictory results.",
  discovery:"Cross-domain discovery: "+records.length+" literature leads retrieved for connecting botanical, phytochemical and biodiversity research. Cross-check plant identity with taxonomy and occurrence sources.",
  gaps:"Coverage-gap scan: "+(records.length-metadataComplete)+" displayed records lack one or more basic metadata fields. This identifies gaps in this result sample, not global research gaps.",
  impact:"Research output snapshot: "+journals.size+" journal titles and "+new Set(dated.map(x=>x.year).filter(Boolean)).size+" publication years in the displayed sample. No citation-impact score is calculated.",
  report:"Research brief sources: "+records.length+" PMID-linked records assembled with publication metadata. Open and review the original papers before citing or drawing conclusions."
 };
 const summary=taskSummaries[e.id]||("PubMed returned "+(d.esearchresult?.count||ids.length)+" indexed result(s); showing "+ids.length+". Search relevance is not evidence strength. Review original methods, results and limitations.");
 return {items:records,summary:summary+" Search relevance is not evidence strength; inspect original methods, results and limitations.",source:"NCBI E-utilities / PubMed"};
}
export default function ResearchEnvironments({onClose}:{onClose:()=>void}){
 const [active,setActive]=useState<Env|null>(null),[q,setQ]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<{items:RecordItem[];summary:string;source:string}|null>(null);
 const tracks=Array.from(new Set(envs.map(e=>e.track)));
 async function run(){if(!active)return;setBusy(true);setError("");setResult(null);try{setResult(await queryData(active,q));}catch(e){setError(e instanceof Error?e.message:"Live lookup failed.");}finally{setBusy(false);}}
 function choose(e:Env){setActive(e);setQ("");setResult(null);setError("");}
 return <div className="env-overlay" role="dialog" aria-modal="true" aria-label="Research environments"><div className="env-shell">
 <header className="env-top"><div className="env-brand"><span className="env-mark"><Leaf/></span><div><b>HERBARIUM / NEXUS</b><small>INDEPENDENT SCIENTIFIC ENVIRONMENTS</small></div></div><span className="env-live"><i/> LIVE PUBLIC DATA</span><button className="icon-button" onClick={onClose} aria-label="Close"><X/></button></header>
 {!active?<div className="env-directory"><div className="env-intro"><span className="eyebrow">SYSTEM DIRECTORY / SCIENTIFIC INTELLIGENCE</span><h2>Enter a research <em>universe.</em></h2><p>Choose an independent environment. Live records are fetched from public scientific databases, not generated sample data.</p><div className="env-orbit"><div/><div/><div/><Atom/><span>HERBARIUM<br/>INTELLIGENCE</span></div></div>
 {tracks.map((t,i)=><section className="env-group" key={t}><div className="env-group-title"><b>0{i+1}</b><i/>{t}</div><div className="env-grid">{envs.filter(e=>e.track===t).map((e,j)=><button className="env-card" key={e.id} onClick={()=>choose(e)}><div className="env-card-top"><span>ENVIRONMENT / {String(j+1).padStart(2,"0")}</span><ChevronRight/></div><div className="env-icon">{e.mode==="gbif"?<Globe2/>:e.mode==="pubchem"?<Atom/>:e.mode==="trials"?<Activity/>:<Network/>}</div><h3>{e.name}</h3><p>{e.desc}</p><div className="env-card-foot"><span>{e.mode==="gbif"?"GBIF":e.mode==="pubchem"?"PUBCHEM":e.mode==="trials"?"CLINICALTRIALS.GOV":"PUBMED / NCBI"}</span><span>OPEN <ExternalLink size={12}/></span></div></button>)}</div></section>)}
 <div className="env-ethics"><ShieldCheck/><div><b>Evidence before assertion</b><span>Traditional knowledge requires attribution and permission. Database hits are evidence leads, not medical advice, efficacy claims or safety recommendations.</span></div></div></div>
 :<div className="env-work"><button className="env-back" onClick={()=>setActive(null)}>← ALL ENVIRONMENTS</button><div className="env-work-title"><div><span className="eyebrow">{active.track} / LIVE WORKSPACE</span><h2>{active.name}</h2><p>{active.task}. {active.desc}</p></div><div className="env-sigil"><div/><div/><Atom/></div></div><div className="env-features">{active.features.map(x=><span key={x}><CheckCircle2/>{x}</span>)}</div>
 <div className="env-query"><label><Search/> {active.task.toUpperCase()} <small>{active.mode==="gbif"?"GBIF":active.mode==="pubchem"?"PubChem":active.mode==="trials"?"ClinicalTrials.gov":"PubMed / NCBI"}</small></label><div><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} placeholder={taskPlans[active.id].hint}/><button className="button button-primary" disabled={busy} onClick={run}>{busy?<LoaderCircle className="spin"/>:<Search/>}{busy?"QUERYING":"RUN QUERY"}</button></div><small>{taskPlans[active.id].hint} Request uses this environment’s dedicated search strategy and public source. No paid API key required.</small></div>
 {error&&<div className="env-error"><AlertTriangle/>{error}</div>}
 {result&&<div className="env-results"><span className="eyebrow">TASK RESPONSE / {active.task} / {result.source}</span><h3>{result.items.length} returned records</h3><p className="env-summary">{result.summary}</p>{result.items.map((r,i)=><article className="env-record" key={r.id+i}><b>{String(i+1).padStart(2,"0")}</b><div><h4>{r.title}</h4><span>{r.sub}</span><p>{r.detail}</p><small>{r.id}</small></div><a href={r.url} target="_blank" rel="noreferrer"><ExternalLink/></a></article>)}{!result.items.length&&<p className="env-summary">No records returned. Try a synonym or broader query.</p>}</div>}
 {!result&&!error&&<div className="env-wait"><div><Sparkles/></div><b>Environment initialised</b><span>Run a query to retrieve original source records.</span></div>}
 <div className="env-footnote"><ShieldCheck/> {active.mode==="gbif"?"GBIF occurrence records may be incomplete, duplicated or lack coordinates; counts are not abundance or threat status.":active.mode==="pubchem"?"Chemical descriptors do not establish biological activity, safety or therapeutic effect.":active.mode==="trials"?"Registry entries are not proof of successful outcomes; inspect protocol and published results.":"PubMed search matches are not evidence grades. Read original papers and assess study design and limitations."}</div></div>}
 <footer className="env-footer"><span>HERBARIUM INTELLIGENCE NETWORK</span><span>PUBLIC DATA · SOURCE FIRST · HUMAN REVIEW</span><span>NO PAID API KEY REQUIRED</span></footer></div></div>;
}
