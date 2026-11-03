const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

export type ExtractionResult = {
  document_name: string;
  extraction_mode: string;
  review_required: boolean;
  extracted_entities: Array<{ text: string; entity_type: string; confidence: number; evidence: string }>;
  source_notes: string[];
  warnings: string[];
};

export async function extractDocument(file: File): Promise<ExtractionResult> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(API_BASE + "/api/v1/extract", { method: "POST", body: form });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Document extraction failed.");
  }
  return response.json() as Promise<ExtractionResult>;
}

export async function checkApi(): Promise<boolean> {
  try {
    const response = await fetch(API_BASE + "/health", { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch { return false; }
}

export type EthnoAnalysis = {
  document_name:string; region_context:string; classification:string[];
  plant_entities:Array<{scientific_name:string;family:string;mention_count:number;mentions:Array<{matched_term:string;language:string;excerpt:string}>;identity_status:string}>;
  compound_mentions:Array<{name:string;status:string}>;
  citations:Array<{type:string;value:string;verification:string}>;
  timeline:Array<{year:number;mentions:number;context:string}>;
  summary_candidates:string[];
  table_extraction:{tables_detected:number;tables:Array<{page:number;rows:unknown[][]}>};
  source_quality:{score:number;band:string;signals:Record<string,unknown>;warning:string};
  missing_attribution_warnings:string[];duplicate_signals:Array<{type:string;detail:string}>;
  page_count:number;language_support_note:string;ethical_status:string;review_required:boolean;
};
export type EthnoComparison = {documents:EthnoAnalysis[];shared_plant_entities:string[];document_overlap:Array<{plant:string;document_count:number}>;timeline_comparison:Array<{document:string;years:number[]}>;review_flags:string[];comparison_mode:string};
export async function analyzeEthnoDocument(file:File,region:string):Promise<EthnoAnalysis>{
  if(!API_BASE)throw new Error("EthnoKnowledge API is not configured.");
  const form=new FormData();form.append("file",file);form.append("region",region);
  const response=await fetch(API_BASE+"/api/v1/ethno/analyze",{method:"POST",body:form});
  if(!response.ok)throw new Error(await response.text()||"Analysis failed.");
  return response.json();
}
export async function compareEthnoDocuments(files:File[],region:string):Promise<EthnoComparison>{
  if(!API_BASE)throw new Error("EthnoKnowledge API is not configured.");
  const form=new FormData();files.forEach(file=>form.append("files",file));form.append("region",region);
  const response=await fetch(API_BASE+"/api/v1/ethno/compare",{method:"POST",body:form});
  if(!response.ok)throw new Error(await response.text()||"Comparison failed.");
  return response.json();
}

export type PhytoCompound = {id:string;name:string;formula:string;mass:number;plant:string;synonyms:string[];smiles:string;class:string;logp:number;hbd:number;hba:number;tpsa:number;source:string;pm:string;note:string;prediction_status:string;evidence_status:string};
export async function getPhytoCatalog():Promise<{compounds:PhytoCompound[];plants:string[];disclaimer:string}>{const r=await fetch(API_BASE+"/api/v1/phytochem/catalog");if(!r.ok)throw new Error("PhytoChem catalogue could not be loaded.");return r.json();}
export async function comparePhytoCompounds(compound_ids:string[]):Promise<any>{const r=await fetch(API_BASE+"/api/v1/phytochem/compare",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({compound_ids})});if(!r.ok)throw new Error(await r.text()||"Comparison failed.");return r.json();}
