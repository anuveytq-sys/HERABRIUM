import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ExternalLink, Globe2, LoaderCircle, Search, ShieldCheck, X } from "lucide-react";
import OccurrenceGlobe from "./OccurrenceGlobe";
import { requestResearch, ResearchBridgeResults, type ResearchBridgeResult } from "./ResearchBridgePanel";

type Environment = { id: string; name: string; eyebrow: string; description: string; purpose: string };
type Taxon = { key: number; usageKey?: number; scientificName: string; canonicalName?: string; rank?: string; status?: string; confidence?: number; kingdom?: string; phylum?: string; order?: string; family?: string; genus?: string; acceptedUsageKey?: number };
type Occurrence = { key: number; scientificName?: string; country?: string; countryCode?: string; stateProvince?: string; locality?: string; eventDate?: string; year?: number; basisOfRecord?: string; datasetName?: string; datasetKey?: string; institutionCode?: string; collectionCode?: string; catalogNumber?: string; recordedBy?: string; decimalLatitude?: number; decimalLongitude?: number; coordinateUncertaintyInMeters?: number; issues?: string[]; references?: string; taxonKey?: number; habitat?: string; occurrenceRemarks?: string; establishmentMeans?: string; iucnRedListCategory?: string };
type Result = { taxon: Taxon; count: number; occurrences: Occurrence[]; source: string };
const environments: Environment[] = [
 {id:"biosphere",name:"BioSphere 3D",eyebrow:"01 / SPECIES DISTRIBUTION",description:"Explore where a taxon has been recorded, with coordinate-backed occurrence points and taxonomic context.",purpose:"Distribution explorer"},
 {id:"risk",name:"Biodiversity Risk Observatory",eyebrow:"02 / OBSERVATION GAPS",description:"Inspect geographic, temporal and metadata coverage gaps. Observation density is not extinction risk.",purpose:"Coverage audit"},
 {id:"climate",name:"Climate Intelligence",eyebrow:"03 / ENVIRONMENTAL READINESS",description:"Review dates, coordinates and locality metadata needed for later environmental analysis. No climate values are fabricated.",purpose:"Environmental readiness"},
 {id:"provenance",name:"Botanical Provenance",eyebrow:"04 / SPECIMEN TRACEABILITY",description:"Prioritise preserved specimens and inspect dataset, institution, collector and collection identifiers.",purpose:"Specimen provenance"},
 {id:"econetwork",name:"EcoNetwork Intelligence",eyebrow:"05 / ECOLOGICAL CONNECTIONS",description:"Connect a taxon to countries, regions, datasets and observation types represented in returned records.",purpose:"Ecological network"},
 {id:"conservation",name:"Conservation Dashboard",eyebrow:"06 / CONSERVATION EVIDENCE",description:"Review occurrence coverage and missing evidence before consulting authoritative conservation assessments.",purpose:"Evidence readiness"},
 {id:"sustainability",name:"Sustainability Simulator",eyebrow:"07 / SCENARIO WORKSPACE",description:"Model transparent, hypothetical changes to the observed record sample without predicting real-world outcomes.",purpose:"Scenario modelling"}
];
const API="https://api.gbif.org/v1";
function normaliseTaxon(payload: Taxon & { usageKey?: number }): Taxon {
 return { ...payload, key: payload.key ?? payload.usageKey ?? payload.acceptedUsageKey ?? 0 };
}
const styles = `
.b4{color:#dcebe2;background:linear-gradient(145deg,#07130f,#0b1d16);border:1px solid #234536;border-radius:20px;padding:clamp(14px,2.5vw,24px);overflow:hidden}
.b4 *{box-sizing:border-box}.b4 button,.b4 input,.b4 select{font:inherit}.b4 button{cursor:pointer}.b4muted{color:#91aa9b;font-size:11px;letter-spacing:.09em}.b4head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}.b4head h3{font-size:clamp(23px,3vw,34px);margin:8px 0}.b4head p{color:#9db5a6;max-width:720px;line-height:1.65;margin:0}.b4badge{border:1px solid #3b7656;color:#a8d5b5;padding:8px 11px;border-radius:30px;font-size:10px;letter-spacing:.1em;white-space:nowrap}.b4grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:20px 0}.b4card{border:1px solid #234536;background:#0c1b16;border-radius:13px;padding:14px;text-align:left;color:#dcebe2;min-height:136px;transition:transform .2s,border-color .2s,background .2s}.b4card:hover,.b4card.active{transform:translateY(-2px);border-color:#78b58b;background:#10271d}.b4card strong{display:block;font-size:14px;margin:9px 0 6px}.b4card p{font-size:12px;color:#9db5a6;line-height:1.5;margin:0}.b4card span{font-size:9px;letter-spacing:.1em;color:#83bd96}.b4controls{display:grid;grid-template-columns:minmax(200px,1fr) 145px 145px 150px auto;gap:8px;align-items:end;border:1px solid #234536;background:#0a1913;border-radius:14px;padding:12px}.b4field label{display:block;color:#91aa9b;font-size:10px;letter-spacing:.1em;margin:0 0 6px}.b4field input,.b4field select{width:100%;min-width:0;background:#10271d;color:#e5f2e9;border:1px solid #355b45;border-radius:8px;padding:11px;outline:none}.b4field input:focus,.b4field select:focus{border-color:#90c6a0}.b4btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #527e61;background:#173a29;color:#e5f2e9;border-radius:9px;padding:11px 13px;font-size:12px}.b4btn:disabled{opacity:.55;cursor:wait}.b4stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin:12px 0}.b4stat{background:#0c1b16;border:1px solid #234536;border-radius:12px;padding:13px}.b4stat b{display:block;font-size:22px}.b4stat span{color:#91aa9b;font-size:9px;letter-spacing:.09em}.b4layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,.8fr);gap:12px;margin-top:12px}.b4panel{background:#0c1b16;border:1px solid #234536;border-radius:14px;padding:14px;min-width:0}.b4panel h4{font-size:13px;margin:0 0 10px}.b4map{width:100%;height:auto;display:block;background:radial-gradient(ellipse at center,#102b20,#091711 72%);border-radius:10px}.b4map text{fill:#70917e;font-size:8px;letter-spacing:1px}.b4timeline{display:flex;align-items:end;gap:4px;height:100px;margin-top:10px}.b4bar{flex:1;min-width:4px;background:linear-gradient(0deg,#4e9c6a,#a5d8ad);border-radius:3px 3px 0 0;position:relative}.b4bar span{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:8px;color:#91aa9b}.b4records{margin-top:12px}.b4record{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;padding:12px 0;border-top:1px solid #234536;align-items:start}.b4record>span{font-size:10px;color:#83bd96}.b4record h5{font-size:12px;margin:0 0 5px}.b4record p{font-size:11px;color:#9db5a6;margin:0 0 5px;line-height:1.5}.b4record a{color:#a8d5b5}.b4notice{display:flex;gap:9px;align-items:flex-start;border:1px solid #385a46;background:#10271d;padding:12px;border-radius:10px;color:#a9c2b1;font-size:11px;line-height:1.55;margin-top:12px}.b4error{border-color:#8b5b43;color:#ffc4a3}.b4tax{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.b4tax div{padding:9px;border-bottom:1px solid #234536}.b4tax small{display:block;color:#91aa9b;font-size:9px;letter-spacing:.1em}.b4tax b{font-size:12px;word-break:break-word}.b4footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#799987;font-size:9px;letter-spacing:.1em;margin-top:18px}
@media(max-width:900px){.b4grid{grid-template-columns:repeat(2,minmax(0,1fr))}.b4controls{grid-template-columns:1fr 1fr}.b4controls .b4field:first-child{grid-column:1/-1}.b4layout{grid-template-columns:1fr}.b4stats{grid-template-columns:repeat(3,minmax(0,1fr))}.b4tax{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:520px){.b4grid{grid-template-columns:1fr}.b4card{min-height:0}.b4controls{grid-template-columns:1fr}.b4controls .b4field:first-child{grid-column:auto}.b4stats{grid-template-columns:repeat(2,minmax(0,1fr))}.b4record{grid-template-columns:25px minmax(0,1fr) auto}}
`;
function normaliseQuery(value:string){return value.trim().replace(/^(?:where (?:is|are|can i find)|what is the distribution of|what are the occurrence records for|distribution of|occurrence records for|show(?: me)?(?: the)?(?: occurrence records for)?|find|search for|map(?: occurrences of)?|records for|tell me about|how many occurrences of|how many records for)\s+/i,"").replace(/\s+(?:found|distributed|occurs|grows|native to|present)\s*$/i,"").replace(/[?.!,]+$/,"").trim();}
function mapRowsForDensity(rows:Occurrence[],specimensOnly:boolean){return specimensOnly?rows.filter(o=>o.basisOfRecord==="PRESERVED_SPECIMEN"):rows;}
function project(lon:number,lat:number){return {x:((lon+180)/360)*720,y:((90-lat)/180)*300};}
function safeDate(o:Occurrence){return o.eventDate|| (o.year?String(o.year):"Date not supplied");}
function makeCsv(rows:Occurrence[]){const cols=["key","scientificName","country","stateProvince","locality","eventDate","basisOfRecord","datasetName","institutionCode","catalogNumber","recordedBy","decimalLatitude","decimalLongitude","coordinateUncertaintyInMeters"];const q=(v:unknown)=>'\"'+String(v??"").replace(/"/g,'""')+'\"';return [cols.join(","),...rows.map(r=>cols.map(k=>q((r as any)[k])).join(","))].join("\n");}
export default function ResearchEnvironments({onClose}:{onClose:()=>void}){
 const [active,setActive]=useState<Environment>(environments[0]);
 const [query,setQuery]=useState("");
 const [country,setCountry]=useState("");
 const [year,setYear]=useState("");
 const [basis,setBasis]=useState("ALL");
 const [onlyCoordinates,setOnlyCoordinates]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [result,setResult]=useState<Result|null>(null);
 const [bridgeResult,setBridgeResult]=useState<ResearchBridgeResult|null>(null);
 const [bridgeError,setBridgeError]=useState("");
 const [offset,setOffset]=useState(0);
 const [scenario,setScenario]=useState(20);
 const [showAll,setShowAll]=useState(false);
 const [layers,setLayers]=useState({points:true,specimens:false,heatmap:true});
 const [compareQuery,setCompareQuery]=useState("");
 const [comparison,setComparison]=useState<Array<{name:string;rank:string;count:number}>>([]);
 const [regional,setRegional]=useState<Array<{name:string;count:number}>>([]);
 const [iucnCategory,setIucnCategory]=useState<string|null>(null);
 const [regionalRichness,setRegionalRichness]=useState<{country:string;count:number;truncated:boolean}|null>(null);
 const currentRows=result?.occurrences||[];
 const recordsWithCoords=useMemo(()=>currentRows.filter(o=>Number.isFinite(o.decimalLatitude)&&Number.isFinite(o.decimalLongitude)),[currentRows]);
 const uniqueCountries=new Set(currentRows.map(o=>o.country).filter(Boolean));
 const uniqueDatasets=new Set(currentRows.map(o=>o.datasetName).filter(Boolean));
 const years=useMemo(()=>{const map=new Map<number,number>();currentRows.forEach(o=>{const y=o.year||(o.eventDate?Number(o.eventDate.slice(0,4)):0);if(y>=1700&&y<=2100)map.set(y,(map.get(y)||0)+1)});return [...map.entries()].sort((a,b)=>a[0]-b[0])},[currentRows]);
 const timelineMax=Math.max(1,...years.map(x=>x[1]));
 const densityCells=useMemo(()=>{const bins=new Map<string,{x:number;y:number;count:number}>();mapRowsForDensity(currentRows,layers.specimens).forEach(o=>{if(o.decimalLatitude==null||o.decimalLongitude==null)return;const p=project(o.decimalLongitude,o.decimalLatitude);const key=Math.floor(p.x/24)+":"+Math.floor(p.y/20);const cell=bins.get(key)||{x:Math.floor(p.x/24)*24+12,y:Math.floor(p.y/20)*20+10,count:0};cell.count++;bins.set(key,cell)});return [...bins.values()]},[currentRows,layers.specimens]);
 const specimens=currentRows.filter(o=>o.basisOfRecord==="PRESERVED_SPECIMEN");
 const habitats=[...new Set(currentRows.map(o=>o.habitat).filter((x):x is string=>Boolean(x)))].slice(0,6);
 const fieldNotes=currentRows.map(o=>o.occurrenceRemarks).filter((x):x is string=>Boolean(x)).slice(0,3);
 const completeness=currentRows.length?Math.round(currentRows.filter(o=>o.eventDate&&o.country&&o.datasetName&&o.decimalLatitude!=null&&o.decimalLongitude!=null).length/currentRows.length*100):0;
 const stats=[
  [result?.count.toLocaleString()||"—","MATCHING OCCURRENCES"],
  [recordsWithCoords.length.toString(),"MAPPED IN THIS PAGE"],
  [uniqueCountries.size.toString(),"COUNTRIES IN THIS PAGE"],
  [specimens.length.toString(),"PRESERVED SPECIMENS"],
  [completeness+"%","PAGE METADATA COMPLETENESS"]
 ];
 async function run(nextOffset=0){
  const term=normaliseQuery(query);if(!term){setError("Enter a plant, animal, fungus or other taxon name, optionally phrased as a distribution question.");return}
  setBusy(true);setError("");setBridgeError("");setResult(null);setBridgeResult(null);setOffset(nextOffset);
  const bridgePromise=requestResearch(term,active.id).catch((reason)=>{setBridgeError(reason instanceof Error?reason.message:"The public research bridge is temporarily unavailable.");return null;});
  const applyBridgeFallback=(bridge:ResearchBridgeResult)=>{
   setBridgeResult(bridge);
   if(!bridge.taxon?.key||!bridge.taxon.scientific_name)return false;
   const taxon:Taxon={key:bridge.taxon.key,scientificName:bridge.taxon.scientific_name,canonicalName:bridge.taxon.canonical_name,rank:bridge.taxon.rank,status:bridge.taxon.taxonomic_status,confidence:bridge.taxon.confidence,kingdom:bridge.taxon.kingdom,phylum:bridge.taxon.phylum,order:bridge.taxon.order,family:bridge.taxon.family,genus:bridge.taxon.genus};
   const occurrences:Occurrence[]=bridge.occurrences.map((row,index)=>({key:row.occurrence_id||index,scientificName:row.scientific_name,country:row.country,countryCode:row.country_code,stateProvince:row.state_province,locality:row.locality,eventDate:row.event_date,year:row.year,basisOfRecord:row.record_type,datasetName:row.dataset,institutionCode:row.institution,collectionCode:row.collection,catalogNumber:row.catalogue_number,recordedBy:row.recorded_by,decimalLatitude:row.latitude,decimalLongitude:row.longitude,habitat:row.habitat_note,occurrenceRemarks:row.field_note}));
   setResult({taxon,count:bridge.occurrence_summary.total_indexed_records,occurrences,source:"HERABRIUM Research Bridge · GBIF / Wikidata / Crossref"});
   setRegional([]);setIucnCategory(null);setRegionalRichness(null);setComparison([]);
   return true;
  };
  try{
   const matchRes=await fetch(API+"/species/match?name="+encodeURIComponent(term)+"&strict=false");
   if(!matchRes.ok){
    const bridge=await bridgePromise;
    if(bridge&&applyBridgeFallback(bridge))return;
    throw new Error("GBIF taxonomy service is temporarily unavailable ("+matchRes.status+").");
   }
   const match=normaliseTaxon(await matchRes.json() as Taxon & {usageKey?:number});
   if(!match.scientificName||!match.key){
    const bridge=await bridgePromise;
    if(bridge&&applyBridgeFallback(bridge))return;
    throw new Error("No taxonomic match was found. Try an accepted scientific name or shorter common name.");
   }
   let taxon=match;
   if(match.acceptedUsageKey&&match.status==="SYNONYM"){
    const accepted=await fetch(API+"/species/"+match.acceptedUsageKey);
    if(accepted.ok)taxon=normaliseTaxon(await accepted.json() as Taxon & {usageKey?:number});
   }
   const params=new URLSearchParams({taxonKey:String(taxon.key),limit:"100",offset:String(nextOffset),orderBy:"eventDate",order:"DESC"});
   if(onlyCoordinates)params.set("hasCoordinate","true");
   if(country)params.set("country",country.toUpperCase());
   if(year)params.set("year",year);
   if(basis!=="ALL")params.set("basisOfRecord",basis);
   const occurrenceRes=await fetch(API+"/occurrence/search?"+params.toString());
   if(!occurrenceRes.ok)throw new Error("GBIF occurrence service is temporarily unavailable ("+occurrenceRes.status+").");
   const payload=await occurrenceRes.json();
   const rows=(payload.results||[]) as Occurrence[];
   const facetParams=new URLSearchParams({taxonKey:String(taxon.key),limit:"0",facet:"country",facetLimit:"20",facetOffset:"0"});
   const facetResponse=await fetch(API+"/occurrence/search?"+facetParams.toString());
   if(facetResponse.ok){const facetPayload=await facetResponse.json();setRegional((facetPayload.facets?.[0]?.counts||[]).map((x:{name:string;count:number})=>({name:x.name,count:x.count})));}else setRegional([]);
   const conservationResponse=await fetch(API+"/species/"+taxon.key+"/iucnRedListCategory");
   if(conservationResponse.ok){
    const conservationData=await conservationResponse.json();
    const conservationRows=Array.isArray(conservationData)?conservationData:(conservationData?.results||[conservationData]);
    const found=conservationRows.find((x:any)=>typeof x==="string"||x?.category||x?.threatStatus||x?.code);
    setIucnCategory(typeof found==="string"?found:(found?.category||found?.threatStatus||found?.code||null));
   }else setIucnCategory(null);
   if(country){
    const richnessParams=new URLSearchParams({country:country.toUpperCase(),limit:"0",facet:"speciesKey",facetLimit:"1000",facetOffset:"0"});
    const richnessResponse=await fetch(API+"/occurrence/search?"+richnessParams.toString());
    if(richnessResponse.ok){const richnessData=await richnessResponse.json();const count=richnessData.facets?.[0]?.counts?.length||0;setRegionalRichness({country:country.toUpperCase(),count,truncated:count>=1000});}
    else setRegionalRichness(null);
   }else setRegionalRichness(null);
   setResult({taxon,count:Number(payload.count||0),occurrences:rows,source:"GBIF Species API + Occurrence API"});
   setBridgeResult(await bridgePromise);
   setComparison([]);
  }catch(e){
   const bridge=await bridgePromise;
   if(bridge&&applyBridgeFallback(bridge))return;
   setError(e instanceof Error?e.message:"The live biodiversity lookup failed. Please retry.");
  }
  finally{setBusy(false);}
 }
 async function compareTaxa(){
  const names=compareQuery.split(",").map(x=>normaliseQuery(x)).filter(Boolean).slice(0,3);if(!names.length){setError("Enter up to three taxon names separated by commas.");return;}
  setBusy(true);setError("");try{const rows=await Promise.all(names.map(async name=>{const m=await fetch(API+"/species/match?name="+encodeURIComponent(name));if(!m.ok)throw new Error("GBIF taxonomy lookup failed for "+name);let t=normaliseTaxon(await m.json() as Taxon & {usageKey?:number});if(t.acceptedUsageKey&&t.status==="SYNONYM"){const a=await fetch(API+"/species/"+t.acceptedUsageKey);if(a.ok)t=normaliseTaxon(await a.json() as Taxon & {usageKey?:number});}const r=await fetch(API+"/occurrence/search?taxonKey="+t.key+"&limit=0");if(!r.ok)throw new Error("Occurrence count unavailable for "+name);const d=await r.json();return {name:t.scientificName||name,rank:t.rank||"Unknown rank",count:Number(d.count||0)};}));setComparison(rows);}catch(e){setError(e instanceof Error?e.message:"Taxon comparison failed.");}finally{setBusy(false);}
 }
 function download(kind:"csv"|"geojson"){
  if(!result)return;
  const rows=currentRows;
  const body=kind==="csv"?makeCsv(rows):JSON.stringify({type:"FeatureCollection",name:result.taxon.scientificName,source:result.source,generatedAt:new Date().toISOString(),features:rows.filter(o=>o.decimalLatitude!=null&&o.decimalLongitude!=null).map(o=>({type:"Feature",geometry:{type:"Point",coordinates:[o.decimalLongitude,o.decimalLatitude]},properties:{gbifOccurrenceKey:o.key,scientificName:o.scientificName,country:o.country,eventDate:o.eventDate,basisOfRecord:o.basisOfRecord,datasetName:o.datasetName,institutionCode:o.institutionCode}}))},null,2);
  const url=URL.createObjectURL(new Blob([body],{type:kind==="csv"?"text/csv":"application/geo+json"}));const a=document.createElement("a");a.href=url;a.download="herbarium-"+result.taxon.scientificName.replace(/[^a-z0-9]+/gi,"-").toLowerCase()+"-occurrences."+(kind==="csv"?"csv":"geojson");a.click();URL.revokeObjectURL(url);
 }
 function choose(env:Environment){setActive(env);setResult(null);setError("");setShowAll(false)}
 const mapRows=(active.id==="provenance"||layers.specimens)?currentRows.filter(o=>o.basisOfRecord==="PRESERVED_SPECIMEN"):currentRows;
 const visibleRows=showAll?currentRows:currentRows.slice(0,12);
 return <div className="b4" role="region" aria-label="HERBARIUM Phase 4 Biodiversity Explorer"><style>{styles}</style>
  <header className="b4head"><div><span className="b4muted">PHASE 04 / BIODIVERSITY & SUSTAINABILITY INTELLIGENCE</span><h3>Explore the living <em style={{color:"#91cba7"}}>biosphere.</em></h3><p>Seven focused research environments powered by live GBIF taxonomy and occurrence records. Search scientific or common taxon names, apply geographic and temporal filters, inspect provenance, and export the records actually returned.</p></div><span className="b4badge"><i style={{display:"inline-block",width:6,height:6,borderRadius:9,background:"#7ed69b",marginRight:7}}/> LIVE PUBLIC DATA</span></header>
  <div className="b4grid">{environments.map((env)=><button key={env.id} className={"b4card "+(active.id===env.id?"active":"")} onClick={()=>choose(env)}><span>{env.eyebrow}</span><strong>{env.name}</strong><p>{env.description}</p></button>)}</div>
  <div className="b4head" style={{alignItems:"center",margin:"18px 0 10px"}}><div><span className="b4muted">ACTIVE WORKSPACE / {active.purpose.toUpperCase()}</span><h3 style={{fontSize:22,margin:"5px 0"}}>{active.name}</h3></div><span className="b4muted">SOURCE: GLOBAL BIODIVERSITY INFORMATION FACILITY</span></div>
  <div className="b4controls">
   <div className="b4field"><label>ORGANISM / TAXON OR DISTRIBUTION QUESTION</label><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!busy&&run(0)} placeholder="e.g. Curcuma longa, Bengal tiger, oak tree, where is neem found…"/></div>
   <div className="b4field"><label>COUNTRY CODE</label><input value={country} onChange={e=>setCountry(e.target.value.slice(0,2))} maxLength={2} placeholder="IN, BR, US…"/></div>
   <div className="b4field"><label>YEAR</label><input value={year} onChange={e=>setYear(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric" placeholder="Any year"/></div>
   <div className="b4field"><label>RECORD BASIS</label><select value={basis} onChange={e=>setBasis(e.target.value)}><option value="ALL">All record types</option><option value="PRESERVED_SPECIMEN">Preserved specimen</option><option value="HUMAN_OBSERVATION">Human observation</option><option value="MACHINE_OBSERVATION">Machine observation</option><option value="OBSERVATION">Observation</option><option value="MATERIAL_SAMPLE">Material sample</option></select></div>
   <button className="b4btn" onClick={()=>run(0)} disabled={busy}>{busy?<LoaderCircle className="spin" size={15}/>:<Search size={15}/>} {busy?"SEARCHING":"EXPLORE"}</button>
  </div>
  {bridgeError&&<div className="b4notice b4error"><AlertTriangle size={15}/>{bridgeError} The direct GBIF lookup can still work independently.</div>}
  {bridgeResult&&<ResearchBridgeResults result={bridgeResult}/>}
  <div className="b4head" style={{marginTop:10,alignItems:"center"}}><label style={{display:"flex",gap:8,alignItems:"center",fontSize:11,color:"#9db5a6"}}><input type="checkbox" checked={onlyCoordinates} onChange={e=>setOnlyCoordinates(e.target.checked)}/> Require georeferenced records for map analysis</label><span className="b4muted">UP TO 100 RECORDS PER PAGE · PAGINATION ENABLED</span></div>
  {error&&<div className="b4notice b4error"><AlertTriangle size={16}/>{error}</div>}
  {result&&<><div className="b4tax">{[["ACCEPTED NAME",result.taxon.scientificName],["TAXONOMIC RANK",result.taxon.rank||"Not supplied"],["FAMILY",result.taxon.family||"Not supplied"],["MATCH CONFIDENCE",result.taxon.confidence!=null?result.taxon.confidence+" / 100":"Not supplied"],["KINGDOM",result.taxon.kingdom||"Not supplied"],["ORDER",result.taxon.order||"Not supplied"],["GENUS",result.taxon.genus||"Not supplied"],["TAXON STATUS",result.taxon.status||"Not supplied"]].map(x=><div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></div>)}</div>
  <div className="b4stats">{stats.map(x=><div className="b4stat" key={x[1]}><b>{x[0]}</b><span>{x[1]}</span></div>)}</div>
  <div className="b4layout"><section className="b4panel"><div className="b4head"><div><span className="b4muted">GEOGRAPHIC DISTRIBUTION / PAGE {Math.floor(offset/100)+1}</span><h4 style={{marginTop:7}}>Occurrence map</h4></div><span className="b4muted">{recordsWithCoords.length} COORDINATE RECORDS</span></div>
  <div className="b4muted" style={{margin:"8px 0"}}>INTERACTIVE 3D BIOSPHERE / DRAG TO ROTATE</div><OccurrenceGlobe records={mapRows.filter(o=>o.decimalLatitude!=null&&o.decimalLongitude!=null)}/><svg className="b4map" viewBox="0 0 720 300" role="img" aria-label="Equirectangular map of returned GBIF occurrence coordinates"><defs><pattern id="b4grid" width="60" height="50" patternUnits="userSpaceOnUse"><path d="M60 0H0V50" fill="none" stroke="#244535" strokeWidth=".7"/></pattern><radialGradient id="b4point"><stop stopColor="#d5f6d8" stopOpacity=".9"/><stop offset="1" stopColor="#74c98b" stopOpacity=".15"/></radialGradient></defs><rect width="720" height="300" fill="url(#b4grid)"/>{[-60,-30,0,30,60].map(lat=><g key={lat}><line x1="0" x2="720" y1={project(0,lat).y} y2={project(0,lat).y} stroke="#315844" strokeDasharray="3 5"/><text x="5" y={project(0,lat).y-3}>{lat}°</text></g>)}{[-120,-60,0,60,120].map(lon=><text key={lon} x={project(lon,0).x+2} y="294">{lon}°</text>)}{layers.heatmap&&densityCells.map((cell,i)=><circle key={"heat"+i} cx={cell.x} cy={cell.y} r={Math.min(24,10+cell.count*2)} fill="#76d18f" opacity={Math.min(.32,.08+cell.count*.05)}/>)}{layers.points&&mapRows.filter(o=>o.decimalLatitude!=null&&o.decimalLongitude!=null).map(o=>{const p=project(o.decimalLongitude!,o.decimalLatitude!);return <g key={o.key}><circle cx={p.x} cy={p.y} r="8" fill="url(#b4point)"/><circle cx={p.x} cy={p.y} r="2.4" fill="#b6eac1"/></g>})}<text x="12" y="17">180°W</text><text x="650" y="17">180°E</text></svg>
  <div className="b4head" style={{marginTop:9}}><label style={{fontSize:11,color:"#9db5a6"}}><input type="checkbox" checked={layers.points} onChange={e=>setLayers(v=>({...v,points:e.target.checked}))}/> Show occurrence points</label><label style={{fontSize:11,color:"#9db5a6"}}><input type="checkbox" checked={layers.specimens} onChange={e=>setLayers(v=>({...v,specimens:e.target.checked}))}/> Specimen-only map</label><label style={{fontSize:11,color:"#9db5a6"}}><input type="checkbox" checked={layers.heatmap} onChange={e=>setLayers(v=>({...v,heatmap:e.target.checked}))}/> Density heatmap</label><span className="b4muted">LONGITUDE / LATITUDE</span></div>
  <div style={{marginTop:22}}><span className="b4muted">OBSERVATION TIMELINE / RETURNED PAGE</span><div className="b4timeline">{years.slice(-28).map(([y,n])=><div className="b4bar" key={y} title={y+": "+n+" records"} style={{height:Math.max(5,n/timelineMax*90)+"%"}}><span>{String(y).slice(-2)}</span></div>)}</div>{!years.length&&<p style={{fontSize:11,color:"#91aa9b"}}>No usable year values in this page.</p>}</div></section>
  <aside className="b4panel"><span className="b4muted">ENVIRONMENT ANALYSIS / {active.id.toUpperCase()}</span><h4 style={{marginTop:8}}>{active.purpose}</h4><p style={{fontSize:12,color:"#9db5a6",lineHeight:1.6}}>{active.description}</p>
   <div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">REGIONAL COVERAGE</small><b style={{display:"block",fontSize:25,marginTop:4}}>{uniqueCountries.size}</b><small style={{color:"#91aa9b"}}>countries represented on this page</small></div>
   <div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">DATASET DIVERSITY</small><b style={{display:"block",fontSize:25,marginTop:4}}>{uniqueDatasets.size}</b><small style={{color:"#91aa9b"}}>distinct dataset names on this page</small></div>
   <div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">IUCN RED LIST CATEGORY / GBIF LINKED RECORD</small><b style={{display:"block",fontSize:19,marginTop:4}}>{iucnCategory||"No linked assessment"}</b><small style={{color:"#91aa9b"}}>Category shown only when GBIF returns one; absence is not a risk classification.</small><a href={"https://www.gbif.org/species/"+result.taxon.key} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:7,color:"#a8d5b5",fontSize:11}}>Review taxon source <ExternalLink size={12}/></a></div><div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">HABITAT METADATA / RETURNED RECORDS</small>{habitats.map(h=><small key={h} style={{display:"block",color:"#b9d0c0",marginTop:5}}>{h}</small>)}{!habitats.length&&<small style={{display:"block",color:"#91aa9b",marginTop:5}}>No habitat field supplied in this page.</small>}</div><div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">FIELD NOTES / SOURCE TEXT</small>{fieldNotes.map((note,i)=><small key={i} style={{display:"block",color:"#b9d0c0",marginTop:5,lineHeight:1.45}}>{note.slice(0,180)}</small>)}{!fieldNotes.length&&<small style={{display:"block",color:"#91aa9b",marginTop:5}}>No field notes supplied in this page.</small>}</div><div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">COLLECTION RECORDS</small><b style={{display:"block",fontSize:25,marginTop:4}}>{specimens.length}</b><small style={{color:"#91aa9b"}}>preserved specimens in this page</small></div>
   {active.id==="sustainability"&&<div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><label className="b4muted">HYPOTHETICAL RECORD COVERAGE CHANGE: {scenario>0?"+":""}{scenario}%</label><input type="range" min="-80" max="100" step="5" value={scenario} onChange={e=>setScenario(Number(e.target.value))} style={{width:"100%"}}/><b style={{fontSize:21}}>{Math.max(0,Math.round(result.count*(1+scenario/100))).toLocaleString()}</b><small style={{display:"block",color:"#91aa9b"}}>Illustrative count only; not a forecast or ecological outcome.</small></div>}
   <div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">INDEXED SPECIES RICHNESS / COUNTRY</small>{regionalRichness&&<><b style={{display:"block",fontSize:25,marginTop:4}}>{regionalRichness.truncated?"1,000+":regionalRichness.count.toLocaleString()}</b><small style={{color:"#91aa9b"}}>{regionalRichness.country} · distinct GBIF species keys with occurrence records</small></>}{!regionalRichness&&<small style={{display:"block",color:"#91aa9b",marginTop:5}}>Enter a two-letter country code to estimate indexed species richness.</small>}</div><div style={{padding:"12px 0",borderTop:"1px solid #234536"}}><small className="b4muted">REGIONAL OCCURRENCE COUNTS / GBIF COUNTRY FACET</small>{regional.slice(0,8).map(x=><div key={x.name} style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:11,padding:"5px 0",color:"#b9d0c0"}}><span>{x.name}</span><b>{x.count.toLocaleString()}</b></div>)}{!regional.length&&<small style={{color:"#91aa9b"}}>Regional facet data not available for this result.</small>}</div><div className="b4notice"><ShieldCheck size={15}/><span>{active.id==="risk"?"Coverage gaps reflect digitised observations only; absence of records does not prove species absence.":active.id==="conservation"?"This dashboard does not assign IUCN or legal threat categories. Consult the relevant official assessment.":active.id==="climate"?"No climate measurements, climate projections or causal impacts are included; this is data-readiness only.":active.id==="provenance"?"GBIF occurrence records are not automatically authenticated physical vouchers. Verify institution and catalogue details at source.":active.id==="sustainability"?"Scenario slider changes a displayed sample count mathematically; it does not predict biodiversity or sustainability outcomes.":"Occurrence density is not population abundance, habitat suitability or conservation status."}</span></div>
  </aside></div>
  <section className="b4panel" style={{marginTop:12}}><div className="b4head"><div><span className="b4muted">CROSS-TAXON COMPARISON</span><h4 style={{marginTop:7}}>Compare biodiversity coverage</h4></div><span className="b4muted">UP TO 3 TAXA</span></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><input value={compareQuery} onChange={e=>setCompareQuery(e.target.value)} placeholder="e.g. Curcuma longa, Azadirachta indica, Ocimum tenuiflorum" style={{flex:"1 1 300px",minWidth:0,background:"#10271d",color:"#e5f2e9",border:"1px solid #355b45",borderRadius:8,padding:11}}/><button className="b4btn" disabled={busy} onClick={compareTaxa}>Compare taxa</button></div>{comparison.length>0&&<div className="b4stats" style={{marginBottom:0}}>{comparison.map(x=><div className="b4stat" key={x.name}><b>{x.count.toLocaleString()}</b><span>{x.name} · {x.rank}</span></div>)}</div>}<p style={{fontSize:10,color:"#91aa9b",marginBottom:0}}>Counts are indexed occurrence totals from GBIF, not abundance estimates or comparable survey effort.</p></section>
  <section className="b4panel b4records"><div className="b4head" style={{alignItems:"center"}}><div><span className="b4muted">SOURCE RECORDS / GBIF OCCURRENCE API</span><h4 style={{marginTop:7}}>{result.occurrences.length} records on this page · {result.count.toLocaleString()} total matching</h4></div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button className="b4btn" onClick={()=>setShowAll(v=>!v)}>{showAll?"Show first 12":"Show all 100"}</button><button className="b4btn" onClick={()=>download("csv")}><ArrowDownToLine size={14}/> CSV</button><button className="b4btn" onClick={()=>download("geojson")}><ArrowDownToLine size={14}/> GeoJSON</button></div></div>
   {visibleRows.map((o,i)=><article className="b4record" key={o.key}><span>{String(i+1+offset).padStart(3,"0")}</span><div><h5>{o.scientificName||result.taxon.scientificName}</h5><p>{[o.country,o.stateProvince,o.locality,safeDate(o),o.basisOfRecord].filter(Boolean).join(" · ")}</p><p>{[o.datasetName,o.institutionCode,o.collectionCode,o.catalogNumber,o.recordedBy,o.habitat].filter(Boolean).join(" · ")||"Dataset or collection details not supplied"}</p>{o.occurrenceRemarks&&<p>Field note: {o.occurrenceRemarks}</p>}<small className="b4muted">GBIF KEY {o.key} {o.decimalLatitude!=null&&o.decimalLongitude!=null?" · "+o.decimalLatitude+", "+o.decimalLongitude:" · NO COORDINATES"}</small></div><a href={"https://www.gbif.org/occurrence/"+o.key} target="_blank" rel="noreferrer" aria-label={"Open GBIF record "+o.key}><ExternalLink size={15}/></a></article>)}
   {!result.occurrences.length&&<p style={{color:"#9db5a6",fontSize:12}}>No records match these filters. Remove a filter or try another taxonomic name.</p>}
   <div className="b4head" style={{marginTop:12,alignItems:"center"}}><span className="b4muted">PAGE {Math.floor(offset/100)+1} OF {Math.max(1,Math.ceil(result.count/100))}</span><div style={{display:"flex",gap:8}}><button className="b4btn" disabled={offset===0||busy} onClick={()=>run(Math.max(0,offset-100))}>← Previous</button><button className="b4btn" disabled={offset+100>=result.count||busy} onClick={()=>run(offset+100)}>Next 100 →</button></div></div>
  </section>
  </>}
  {!result&&!error&&<div className="b4notice"><Globe2 size={16}/><span>Select an environment, enter an organism name or a natural-language distribution question, then explore. The service resolves accepted taxonomy and queries live public occurrence data. Results are paginated and exports include only the records shown in the fetched page.</span></div>}
  <footer className="b4footer"><span>HERBARIUM / PHASE 04</span><span>GBIF PUBLIC DATA · SOURCE-LINKED · HUMAN REVIEW</span><button onClick={onClose} style={{background:"transparent",border:0,color:"#91aa9b"}}><X size={13}/> CLOSE ENVIRONMENTS</button></footer>
 </div>;
}
