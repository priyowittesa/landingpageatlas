// FAQ section (sections/Faq.tsx). Filtering by category is handled in public/atlas-landing.js.
// `featured` items show first, before "View all questions" is pressed. `id` is only needed
// where another part of the page links to a specific question.

export type FaqCategoryId = "pi" | "ds" | "cp" | "da";

export const FAQ_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "pi", label: "Platform & Integration" },
  { id: "ds", label: "Data & Security" },
  { id: "cp", label: "Commercial & Pricing" },
  { id: "da", label: "Deployment & Adoption" }
] as const;

export type FaqItem = {
  id?: string;
  category: FaqCategoryId;
  featured?: boolean;
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: "pi",
    featured: true,
    question: "Do we need to replace our existing systems?",
    answer:
      "No. ATLAS works on top of the systems you already run. FABRIX connects to ERPs such as SAP, Oracle and Microsoft Dynamics, to MES, SCADA and IoT streams, and to your databases and cloud storage. Two-way ERP/MES integration is available on the Enterprise tier."
  },
  {
    category: "da",
    featured: true,
    question: "How quickly can we activate ATLAS?",
    answer:
      "Typical initial activation takes 6–18 weeks, depending on systems, scope and data readiness. You start by connecting your operations and get baseline dashboards early, before AI and workflows are switched on in step three."
  },
  {
    category: "cp",
    featured: true,
    question: "How is pricing calculated?",
    answer:
      "ATLAS is sold as packages built around a business problem, and every package can be tailored to your use case. We do not publish a price list: your quote reflects the capabilities you choose, the number of sites, your integrations and your deployment and support needs. Talk to us and we will scope it with your team."
  },
  {
    category: "ds",
    featured: true,
    question: "Does our data train public AI models?",
    answer:
      "No. Your data is never used to train public AI models. Models trained on your data stay inside your ATLAS environment and are used only for your organisation."
  },
  {
    category: "ds",
    featured: true,
    question: "Who owns our data and operational model?",
    answer:
      "You do. Your data, the operational model built in ONTRIX and the outputs ATLAS generates all belong to your organisation."
  },
  {
    category: "da",
    featured: true,
    question: "Can ATLAS run in the cloud, private cloud or on-premise?",
    answer:
      "Yes. Cloud is included as standard in every package. Private cloud and on-premise are available as an add-on and run the same ATLAS release, with the same NEXA models, connectors and support."
  },
  {
    id: "faq-site",
    category: "cp",
    question: "What counts as a site?",
    answer:
      "A site is one operation run as a single unit, such as a plant, a mine, a warehouse, a project site or a facility. Several buildings on one campus that share management and systems count as one site. A very large site with independent operations, or a portfolio of small sites, is priced in your quote. In manufacturing a site is usually a plant; in mining, a mine or contract site."
  },
  {
    category: "pi",
    question: "What is an ontology, and why does it matter?",
    answer:
      "Think of an ontology as a shared map of how your business works. It describes your assets, processes, people and contracts, and how they relate: which sensor monitors which machine, which work order needs which spare part. Because every application and AI recommendation reads the same map, answers stay consistent across departments and every decision can be traced back to its source. In ATLAS, this is ONTRIX."
  },
  {
    category: "pi",
    question: "Can ATLAS write back into ERP/MES systems, or only read data?",
    answer:
      "Both. ATLAS reads from your systems through FABRIX, and with two-way integration it can write approved actions back, such as creating a work order or updating a schedule. Write-backs follow your approval workflow. Write-back is available for SAP, Oracle and Microsoft Dynamics, and for other systems through APIs."
  },
  {
    category: "ds",
    question: "What happens if we stop using ATLAS? Can we export our data and models?",
    answer:
      "Yes. At the end of your subscription you can export your data, operational model and reports in standard formats such as CSV, JSON and RDF. We support a structured exit within 30 days."
  },
  {
    id: "faq-fp",
    category: "cp",
    question: "Who qualifies for the Early Access offer?",
    answer:
      "The Early Access offer is open to the first 10 customers who join ATLAS Early Access and sign a 12-month subscription. They receive Founding Partner pricing: 20% off their subscription for the first 12 months. The offer closes when all places are taken. To apply, tick “Participate in the Early Access trial” when you book your walkthrough."
  },
  {
    category: "pi",
    question: "Is ATLAS available for industries other than manufacturing?",
    answer:
      "Yes. ATLAS has applications for mining, oil & gas, supply chain, construction, property, hospitality, retail and cross-sector enterprise work. The packages on this page cover manufacturing and mining. Every industry is priced per site, so contact us for a quote in yours."
  },
  {
    category: "da",
    question: "Can frontline teams use it without a stable connection?",
    answer:
      "Yes. Mobile capture is offline-first. Supervisors record output, downtime, defects and photos anywhere, and the app syncs when a connection is available."
  }
];
