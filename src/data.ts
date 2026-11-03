export type SourceRecord = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceType: "literature-search" | "biodiversity-dataset" | "curated-demo";
  accessed: string;
  status: "external-source" | "demo-record";
  note: string;
};

export type PlantRecord = {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  summary: string;
  tags: string[];
  traditionalKnowledge: string[];
  researchTopics: string[];
  sources: SourceRecord[];
  completeness: { taxonomy: boolean; literature: boolean; geography: boolean; conservation: boolean };
};

const today = new Date().toISOString().slice(0, 10);

export const plants: PlantRecord[] = [
  {
    id: "curcuma-longa",
    commonName: "Turmeric",
    scientificName: "Curcuma longa L.",
    family: "Zingiberaceae",
    summary: "A rhizomatous species with botanical literature and herbarium records. This starter profile is illustrative and requires specimen-level verification.",
    tags: ["Rhizome", "South Asian research", "Botanical collection"],
    traditionalKnowledge: ["Traditional-use documentation should be attached to a specific publication or community-authorised record before being treated as verified."],
    researchTopics: ["Plant morphology", "Botanical identity", "Literature mapping"],
    sources: [
      { id: "pubmed-curcuma", title: "PubMed literature search: Curcuma longa", publisher: "U.S. National Library of Medicine", url: "https://pubmed.ncbi.nlm.nih.gov/?term=Curcuma+longa", sourceType: "literature-search", accessed: today, status: "external-source", note: "Search landing page; individual publications must be reviewed and cited before making scientific claims." },
      { id: "gbif-curcuma", title: "GBIF species search: Curcuma longa", publisher: "Global Biodiversity Information Facility", url: "https://www.gbif.org/species/search?q=Curcuma%20longa", sourceType: "biodiversity-dataset", accessed: today, status: "external-source", note: "Species search; occurrence records and licensing should be checked at record level." }
    ],
    completeness: { taxonomy: true, literature: true, geography: false, conservation: false }
  },
  {
    id: "azadirachta-indica",
    commonName: "Neem",
    scientificName: "Azadirachta indica A. Juss.",
    family: "Meliaceae",
    summary: "A widely documented tree species. HERBARIUM keeps botanical identity, literature discovery and any evidence interpretation separate.",
    tags: ["Tree", "Botanical literature", "Biodiversity"],
    traditionalKnowledge: ["Traditional-use records require source attribution, cultural context and appropriate permissions."],
    researchTopics: ["Botanical documentation", "Botanical literature", "Species distribution"],
    sources: [
      { id: "pubmed-neem", title: "PubMed literature search: Azadirachta indica", publisher: "U.S. National Library of Medicine", url: "https://pubmed.ncbi.nlm.nih.gov/?term=Azadirachta+indica", sourceType: "literature-search", accessed: today, status: "external-source", note: "Search landing page; not an endorsement of any health claim." },
      { id: "gbif-neem", title: "GBIF species search: Azadirachta indica", publisher: "Global Biodiversity Information Facility", url: "https://www.gbif.org/species/search?q=Azadirachta%20indica", sourceType: "biodiversity-dataset", accessed: today, status: "external-source", note: "Species search; validate taxonomy and occurrence records before analysis." }
    ],
    completeness: { taxonomy: true, literature: true, geography: false, conservation: false }
  },
  {
    id: "ocimum-tenuiflorum",
    commonName: "Holy basil",
    scientificName: "Ocimum tenuiflorum L.",
    family: "Lamiaceae",
    summary: "A plant with botanical and herbarium literature that can be explored through source-linked records. The current profile is an illustrative starting point.",
    tags: ["Aromatic herb", "Literature mapping", "South Asia"],
    traditionalKnowledge: ["Documented cultural and traditional records must retain their original source and community context."],
    researchTopics: ["Plant morphology", "Taxonomy", "Ethnobotanical literature"],
    sources: [
      { id: "pubmed-ocimum", title: "PubMed literature search: Ocimum tenuiflorum", publisher: "U.S. National Library of Medicine", url: "https://pubmed.ncbi.nlm.nih.gov/?term=Ocimum+tenuiflorum", sourceType: "literature-search", accessed: today, status: "external-source", note: "Search landing page; review individual studies before summarising evidence." },
      { id: "gbif-ocimum", title: "GBIF species search: Ocimum tenuiflorum", publisher: "Global Biodiversity Information Facility", url: "https://www.gbif.org/species/search?q=Ocimum%20tenuiflorum", sourceType: "biodiversity-dataset", accessed: today, status: "external-source", note: "Species search; record-level data and licence checks are required." }
    ],
    completeness: { taxonomy: true, literature: true, geography: false, conservation: false }
  }
];

export const researchGaps = [
  { title: "Occurrence records not yet ingested", detail: "The starter plant profiles link to GBIF search pages, but no record-level occurrence dataset has been imported or validated yet.", severity: "data missing", track: "Biodiversity & Sustainability" },
  { title: "Traditional-use claims need source-level records", detail: "The demo profiles intentionally avoid presenting unattributed traditional-use statements as verified knowledge.", severity: "provenance needed", track: "Traditional Knowledge Mining" },
  { title: "Evidence synthesis is not yet performed", detail: "Literature search links are discovery entry points. Individual papers still need extraction, screening and evidence classification.", severity: "review required", track: "Digital Health & Phytotherapy" },
  { title: "Voucher specimen metadata is incomplete", detail: "The starter profiles do not yet include validated institutional barcode, collector, collection date and locality fields.", severity: "enrichment needed", track: "Herbarium specimen digitisation" }
];

export const demoStats = [
  { value: "03", label: "starter plant profiles" },
  { value: "06", label: "external discovery sources" },
  { value: "04", label: "research gaps surfaced" },
  { value: "0", label: "unverified health recommendations" }
];