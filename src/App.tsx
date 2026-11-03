import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpRight, BookOpen, CheckCircle2, ChevronRight, CircleHelp, Database, ExternalLink, FileSearch, Globe2, Leaf, Menu, Network, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Globe from "./components/Globe";
import KnowledgeGraph from "./components/KnowledgeGraph";
import UploadLab from "./components/UploadLab";
import EthnoKnowledgeLab from "./components/EthnoKnowledgeLab";
import PhytoChemLab from "./components/PhytoChemLab";
import { demoStats, plants, researchGaps, type PlantRecord, type SourceRecord } from "./data";

gsap.registerPlugin(ScrollTrigger);

function SourceDrawer({ source, onClose }: { source: SourceRecord | null; onClose: () => void }) {
  if (!source) return null;
  return <div className="drawer-backdrop" onClick={onClose}><aside className="source-drawer" onClick={(event) => event.stopPropagation()}>
    <button className="icon-button drawer-close" onClick={onClose} aria-label="Close source details"><X/></button>
    <span className="eyebrow">PROVENANCE RECORD / {source.id}</span><h2>{source.title}</h2><p>{source.note}</p>
    <div className="source-meta"><span>Publisher</span><strong>{source.publisher}</strong><span>Record type</span><strong>{source.sourceType}</strong><span>Last accessed</span><strong>{source.accessed}</strong><span>Status</span><strong>{source.status === "external-source" ? "External discovery source" : "Demonstration record"}</strong></div>
    <a className="button button-primary full" href={source.url} target="_blank" rel="noreferrer">Open original source <ExternalLink size={15}/></a>
    <p className="tiny-note">A search landing page is not a verified scientific finding. Review individual records and licences before using them in research.</p>
  </aside></div>;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<PlantRecord>(plants[0]);
  const [activeSource, setActiveSource] = useState<SourceRecord | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    let alive = true;
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
    if (base) fetch(base + "/health").then((r) => { if (alive) setApiOnline(r.ok); }).catch(() => { if (alive) setApiOnline(false); });
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((element) => {
        gsap.fromTo(element, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 88%", once: true } });
      });
      gsap.to(".scroll-progress span", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.25 } });
      gsap.to(".hero-orbit", { rotation: 360, duration: 42, repeat: -1, ease: "none" });
      gsap.to(".hero-visual", { y: 115, scale: 0.84, opacity: 0.28, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 } });
      gsap.to(".hero-copy", { y: -75, opacity: 0.22, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 } });
    });
    return () => { alive = false; ctx.revert(); };
  }, []);

  const filteredPlants = useMemo(() => plants.filter((plant) => (plant.commonName + " " + plant.scientificName + " " + plant.family).toLowerCase().includes(query.toLowerCase())), [query]);
  const completeness = Object.values(selectedPlant.completeness).filter(Boolean).length;
  const sourceCount = selectedPlant.sources.length;

  const navigate = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  return <div className="app-shell">
    <div className="scroll-progress"><span/></div>
    <header className="topbar">
      <a className="brand" href="#home" aria-label="HERBARIUM home"><span className="brand-mark"><Leaf size={19}/></span><span>HERBARIUM<small>INTELLIGENCE NETWORK</small></span></a>
      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        <button onClick={() => navigate("intelligence")}>Intelligence</button><button onClick={() => navigate("ethno")}>EthnoKnowledge AI</button><button onClick={() => navigate("phytochem")}>Biodiversity Explorer</button><button onClick={() => navigate("graph")}>Knowledge graph</button><button onClick={() => navigate("research")}>Data gaps</button><button onClick={() => navigate("laboratory")}>Document lab</button>
      </nav>
      <div className="topbar-right"><span className="system-status"><i/> SYSTEM {apiOnline ? "CONNECTED" : "LOCAL DEMO"}</span><button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X/> : <Menu/>}</button><button className="button button-outline header-cta" onClick={() => navigate("intelligence")}>Explore network <ArrowUpRight size={15}/></button></div>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-grid"/>
        <div className="hero-copy">
          <div className="kicker"><span className="pulse-dot"/> GLOBAL BOTANICAL RESEARCH NETWORK <span className="kicker-line"/></div>
          <h1>Where nature's<br/><em>knowledge</em> becomes<br/>scientific intelligence.</h1>
          <p className="hero-lede">Connecting documented traditional knowledge, botanical specimens, scientific literature and biodiversity records — with provenance at every step.</p>
          <div className="hero-actions"><button className="button button-primary" onClick={() => navigate("intelligence")}>Enter research network <ArrowUpRight size={16}/></button><button className="text-button" onClick={() => navigate("manifesto")}>Explore the mission <ArrowDown size={15}/></button></div>
          <div className="hero-metrics">{demoStats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
        </div>
        <div className="hero-visual"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-orbit orbit-three"/><div className="globe-label label-top"><span>FIELD / 001</span><b>BOTANICAL INTELLIGENCE</b></div><Globe/><div className="globe-coordinate">18° 31' N&nbsp; / &nbsp;73° 51' E<br/><span>VISUAL RESEARCH PROJECTION</span></div><div className="floating-chip chip-one"><Leaf size={13}/> SPECIES NETWORK <b>ACTIVE</b></div><div className="floating-chip chip-two"><Leaf size={13}/> SPECIMEN RECORDS <b>03</b></div></div>
        <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><div className="scroll-stem"><i/></div><span>01 / 06 — INTELLIGENCE CORE</span></div>
      </section>

      <section className="manifesto section-pad" id="manifesto">
        <div className="section-index reveal"><span>01</span><i/> THE RESEARCH CHALLENGE</div>
        <div className="manifesto-grid">
          <div className="reveal"><span className="eyebrow">A CONNECTED SCIENTIFIC LANDSCAPE</span><h2>Research knowledge is everywhere.<br/><em>Context is fragmented.</em></h2></div>
          <div className="manifesto-copy reveal"><p>Botanical identity, ethnobotanical records, botanical literature and biodiversity observations often live in separate sources. HERBARIUM creates a traceable layer between them — helping researchers explore connections without turning preliminary records into medical claims.</p><div className="principle"><ShieldCheck/><div><strong>Evidence before assertion.</strong><span>Every record carries its source, status and limitations.</span></div></div></div>
        </div>
        <div className="signal-row reveal"><div><span>01 / DISCOVER</span><b>Find the plant</b></div><ChevronRight/><div><span>02 / EXTRACT</span><b>Structure the record</b></div><ChevronRight/><div><span>03 / CONNECT</span><b>Trace relationships</b></div><ChevronRight/><div><span>04 / QUESTION</span><b>Surface what is missing</b></div></div>
      </section>

      <section className="intelligence-section section-pad" id="intelligence">
        <div className="section-index reveal"><span>02</span><i/> PLANT INTELLIGENCE INDEX</div>
        <div className="section-heading reveal"><div><span className="eyebrow">SEARCH THE STARTER CATALOGUE</span><h2>Begin with a <em>species.</em></h2></div><p>Explore structured demonstration profiles and jump to their external research sources. Starter records are intentionally labelled; source-level verification is still required.</p></div>
        <div className="catalog-layout">
          <div className="catalog-list">
            <label className="search-field"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search common name, species or family…"/><span>{filteredPlants.length.toString().padStart(2, "0")} RESULTS</span></label>
            {filteredPlants.map((plant) => <button className={"plant-result " + (selectedPlant.id === plant.id ? "active" : "")} key={plant.id} onClick={() => setSelectedPlant(plant)}><span className="plant-symbol"><Leaf size={17}/></span><span><strong>{plant.commonName}</strong><em>{plant.scientificName}</em></span><ChevronRight size={17}/></button>)}
            {!filteredPlants.length && <p className="empty-state">No matching starter profile. Try a scientific or common name.</p>}
          </div>
          <div className="plant-profile">
            <div className="profile-topline"><span className="eyebrow">SPECIES DOSSIER / {selectedPlant.id.toUpperCase()}</span><span className="status-pill"><i/> DEMO PROFILE</span></div>
            <div className="profile-title"><div><h3>{selectedPlant.commonName}</h3><em>{selectedPlant.scientificName}</em></div><div className="profile-seal"><Leaf size={25}/><small>BOTANICAL<br/>RECORD</small></div></div>
            <p className="profile-summary">{selectedPlant.summary}</p>
            <div className="taxonomy-line"><span>FAMILY</span><b>{selectedPlant.family}</b><span>PROFILE COMPLETENESS</span><b>{completeness}/4 fields</b></div>
            <div className="completeness-track"><span style={{ width: (completeness / 4 * 100) + "%" }}/></div>
            <div className="profile-columns"><div><span className="eyebrow">BOTANICAL TOPICS</span>{selectedPlant.tags.map((tag) => <span className="tag" key={tag}><Leaf size={12}/>{tag}</span>)}</div><div><span className="eyebrow">RESEARCH TOPICS</span>{selectedPlant.researchTopics.map((topic) => <span className="tag" key={topic}><BookOpen size={12}/>{topic}</span>)}</div></div>
            <div className="profile-sources"><div><span className="eyebrow">SOURCE REGISTER / {sourceCount.toString().padStart(2, "0")}</span><span className="tiny-note">Discovery links, not validated findings</span></div>{selectedPlant.sources.map((source) => <button key={source.id} onClick={() => setActiveSource(source)}><span><Database size={14}/>{source.publisher}</span><ArrowUpRight size={15}/></button>)}</div>
          </div>
        </div>
      </section>

      <section className="ethno-section section-pad" id="ethno">
        <div className="section-index reveal"><span>02</span><i/> ETHNOKNOWLEDGE AI / PHASE TWO</div>
        <div className="section-heading reveal"><div><span className="eyebrow">HISTORICAL KNOWLEDGE MINING</span><h2>Decode the archive.<br/><em>Preserve its context.</em></h2></div><p>Multilingual plant-name discovery, historical terminology, citation and timeline extraction, cross-publication comparison and permission-aware stewardship.</p></div>
        <div className="reveal"><EthnoKnowledgeLab/></div>
      </section>

      <section className="phytochem-section section-pad" id="phytochem"><div className="section-index reveal"><span>03</span><i/> BIODIVERSITY / SPECIMEN INTELLIGENCE</div><div className="section-heading reveal"><div><span className="eyebrow">BOTANICAL SPECIMEN DISCOVERY</span><h2>Explore the <em>botanical world.</em></h2></div><p>Explore botanical taxonomy, specimen provenance, morphology and geographic context through an interactive 3D specimen collection.</p></div><div className="reveal"><PhytoChemLab/></div></section>

      <section className="graph-section section-pad" id="graph">
        <div className="section-index reveal"><span>03</span><i/> RELATIONSHIP INTELLIGENCE</div>
        <div className="section-heading reveal"><div><span className="eyebrow">SOURCE-LINKED RELATIONSHIPS</span><h2>See the science<br/><em>between the lines.</em></h2></div><p>Explore a transparent relationship map for the selected species. Select a node to inspect what the connection means and what still needs verification.</p></div>
        <div className="graph-toolbar reveal"><div><Network size={16}/><span>LIVE GRAPH / {selectedPlant.commonName.toUpperCase()}</span></div><span>SELECT ANY NODE TO INSPECT</span></div>
        <div className="reveal"><KnowledgeGraph plant={selectedPlant}/></div>
        <div className="graph-footnote"><CircleHelp size={15}/> Relationships in this starter graph are exploratory links. Validate each taxonomy and provenance relationship against institutional sources before scientific use.</div>
      </section>

      <section className="research-section section-pad" id="research">
        <div className="section-index reveal"><span>04</span><i/> BOTANICAL DATA QUALITY</div>
        <div className="section-heading reveal"><div><span className="eyebrow">NOT JUST WHAT WE KNOW</span><h2>Make the missing<br/><em>visible.</em></h2></div><p>Gap cards are generated from the completeness and provenance state of the current starter dataset. They are actionable data-quality findings, not claims about the global state of science.</p></div>
        <div className="gap-grid">{researchGaps.map((gap, index) => <article className="gap-card reveal" key={gap.title}><div className="gap-top"><span>GAP / 0{index + 1}</span><span className="gap-severity">{gap.severity}</span></div><div className="gap-icon">{[<Globe2/>, <BookOpen/>, <FileSearch/>, <Leaf/>][index]}</div><h3>{gap.title}</h3><p>{gap.detail}</p><div className="gap-track">{gap.track}<ArrowUpRight size={14}/></div></article>)}</div>
      </section>

      <section className="laboratory-section section-pad" id="laboratory">
        <div className="section-index reveal"><span>05</span><i/> DOCUMENT INTELLIGENCE LAB</div>
        <div className="section-heading reveal"><div><span className="eyebrow">EXPLAINABLE NLP BASELINE</span><h2>From documents<br/>to <em>data points.</em></h2></div><p>Extract candidate entities while retaining context. This first version is deliberately review-first: automated matches are not accepted as verified facts.</p></div>
        <div className="reveal"><UploadLab/></div>
      </section>

      <section className="ethics-section section-pad">
        <div className="section-index reveal"><span>06</span><i/> TRUST & KNOWLEDGE STEWARDSHIP</div>
        <div className="ethics-grid"><div className="reveal"><span className="eyebrow">A RESPONSIBLE RESEARCH NETWORK</span><h2>Knowledge has<br/>a <em>provenance.</em></h2><p>Traditional knowledge is not an unowned dataset. HERBARIUM is designed to preserve attribution, cultural context and permission boundaries.</p></div><div className="ethics-list reveal"><div><ShieldCheck/><span><b>Attribution first</b><small>Keep the origin, authorship and community context attached to every record.</small></span><CheckCircle2/></div><div><Database/><span><b>Permission-aware records</b><small>Support restricted, consent-based and public access states.</small></span><CheckCircle2/></div><div><Sparkles/><span><b>Human review</b><small>Keep extracted candidates separate from verified scientific records.</small></span><CheckCircle2/></div></div></div>
        <div className="ethics-note reveal"><span>NON-CLINICAL RESEARCH TOOL</span><p>HERBARIUM does not diagnose, prescribe, assess personal medical suitability or establish that a plant-related claim is safe or effective. It organises research information and makes uncertainty visible.</p></div>
      </section>

      <section className="final-cta section-pad">
        <div className="cta-orb"/><span className="eyebrow reveal">HERBARIUM INTELLIGENCE / PHASE 02</span><h2 className="reveal">Connect the knowledge.<br/><em>Respect the evidence.</em></h2><p className="reveal">A scientific intelligence layer for the world's botanical research landscape.</p><button className="button button-primary reveal" onClick={() => navigate("intelligence")}>Explore plant intelligence <ArrowUpRight size={16}/></button>
        <div className="footer-meta"><span>HERBARIUM INTELLIGENCE NETWORK</span><span>ETHNOKNOWLEDGE AI · PHASE 02</span><a href="https://github.com/anuveytq-sys/HERABRIUM" target="_blank" rel="noreferrer">SOURCE REPOSITORY <ArrowUpRight size={13}/></a></div>
      </section>
    </main>
    <SourceDrawer source={activeSource} onClose={() => setActiveSource(null)}/>
  </div>;
}