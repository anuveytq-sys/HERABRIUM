import {useMemo,useState} from "react";
import type {PlantRecord} from "../data";
type Props={plant:PlantRecord};
type Node={id:string;label:string;kind:string;x:number;y:number;description:string};
export default function KnowledgeGraph({plant}:Props){
 const [selected,setSelected]=useState("plant");
 const nodes=useMemo<Node[]>(()=>{const items:Node[]=[
 {id:"plant",label:plant.commonName,kind:"PLANT TAXON",x:390,y:205,description:plant.scientificName+" · "+plant.family},
 ...plant.sources.slice(0,3).map((source,index)=>({id:"source-"+index,label:source.publisher,kind:"SOURCE RECORD",x:150+index*240,y:350,description:source.title+" · "+source.note})),
 {id:"taxonomy",label:"Taxonomy",kind:"CLASSIFICATION",x:160,y:80,description:"Scientific name and family are starter metadata. Confirm accepted nomenclature and synonyms against current taxonomic references."},
 {id:"specimen",label:"Voucher specimen",kind:"HERBARIUM",x:620,y:80,description:"A verified voucher record should retain institution, barcode, collector, collection number, date, locality and determination history."},
 {id:"knowledge",label:"Documented context",kind:"ARCHIVE",x:650,y:205,description:"Historical or community knowledge requires source attribution, cultural context, permission and human review."}
 ];return items},[plant]);
 const links=useMemo(()=>nodes.filter(n=>n.id!=="plant").map(n=>({from:"plant",to:n.id})),[nodes]);
 const byId=(id:string)=>nodes.find(n=>n.id===id)!;const active=byId(selected);
 return <div className="graph-shell"><svg className="knowledge-graph" viewBox="0 0 780 430" role="img" aria-label={"Botanical provenance graph for "+plant.commonName}><defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>{links.map(link=>{const a=byId(link.from),b=byId(link.to);return <line key={link.to} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="graph-edge"/>})}{nodes.map(node=><g key={node.id} className={"graph-node "+(selected===node.id?"selected":"")} onClick={()=>setSelected(node.id)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setSelected(node.id)}}><circle cx={node.x} cy={node.y} r={node.id==="plant"?42:30}/><text x={node.x} y={node.y+51} textAnchor="middle">{node.label.length>21?node.label.slice(0,19)+"…":node.label}</text><text x={node.x} y={node.y-48} textAnchor="middle" className="graph-kind">{node.kind}</text></g>)}</svg><div className="graph-detail"><span className="eyebrow">SELECTED NODE / {active.kind}</span><strong>{active.label}</strong><p>{active.description}</p></div></div>
}