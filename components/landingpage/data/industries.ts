// "ATLAS in action" carousel (sections/InAction.tsx). One entry per industry tab.
// To rename an industry or swap its screenshot, edit it here: the tab, the big title,
// the window title bar, the description and the image all come from this list.
// Screenshots live in public/images/prototypes/ (the first two load eagerly, the rest lazily).

export type Industry = {
  /** Used in element ids (st-<id>, sp-<id>); keep it lowercase with dashes. */
  id: string;
  name: string;
  /** Small label above the description. */
  chip: string;
  description: string;
  /** Colour of the glow behind the stage while this industry is active. */
  accent: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export const INDUSTRIES: Industry[] = [
  {
    id: "construction",
    name: "Construction Operations",
    chip: "Construction Operations",
    description:
      "ATLAS for construction operations: monitor site progress, safety risks and field evidence in one place.",
    accent: "#8B5CF6",
    image: {
      src: "/images/prototypes/denera.webp",
      alt: "Construction Operation Command Centre screen",
      width: 1000,
      height: 492
    }
  },
  {
    id: "mining",
    name: "Mining Operations",
    chip: "Mining Operations",
    description:
      "An executive dashboard that rolls up production, safety, compliance and capital projects across mining subsidiaries, with AI insights.",
    accent: "#F0525A",
    image: {
      src: "/images/prototypes/mining.webp",
      alt: "Mining operations executive dashboard screen",
      width: 1000,
      height: 495
    }
  },
  {
    id: "hauling-intelligence",
    name: "Hauling Intelligence Dashboard",
    chip: "Mining · Hauling",
    description:
      "An intelligence dashboard with AI insights for mining hauling: track production against target, cycle time and fleet availability, and act on AI recommendations.",
    accent: "#9B6BF2",
    image: {
      src: "/images/prototypes/hauling-intelligence.webp",
      alt: "Hauling intelligence dashboard screen",
      width: 1000,
      height: 495
    }
  },
  {
    id: "well-performance",
    name: "Well performance",
    chip: "Oil & gas",
    description:
      "Monitor well and production performance and see which assets need attention first.",
    accent: "#E0262B",
    image: {
      src: "/images/prototypes/well-performance.webp",
      alt: "Well performance dashboard screen",
      width: 1000,
      height: 495
    }
  },
  {
    id: "cable-manufacturing",
    name: "Cable manufacturing",
    chip: "Manufacturing",
    description:
      "Follow production lines, quality and downtime across a cable plant.",
    accent: "#6366F1",
    image: {
      src: "/images/prototypes/cable-manufacturing.webp",
      alt: "Cable manufacturing dashboard screen",
      width: 1000,
      height: 490
    }
  },
  {
    id: "garment-manufacturing",
    name: "Garment manufacturing",
    chip: "Manufacturing",
    description: "Follow orders, lines and quality across a garment factory.",
    accent: "#C26BF2",
    image: {
      src: "/images/prototypes/garment-manufacturing.webp",
      alt: "Garment manufacturing operations dashboard screen",
      width: 1000,
      height: 494
    }
  }
];
