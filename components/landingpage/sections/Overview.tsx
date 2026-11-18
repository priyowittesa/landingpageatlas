import { ATLAS_OVERVIEW } from "@/lib/seo";

// Only the English overview is shown; the Indonesian one stays in the structured data and llms.txt.
const overview = ATLAS_OVERVIEW[0];

// Words lifted from the overview sentence itself. They drift at different depths while the
// section scrolls past (see "overview stage" in public/atlas-landing.js). Position and depth
// live in data attributes so the script owns all motion; the whole layer is decorative.
const FLOATING_TERMS = [
  { label: "Enterprise AI", x: 27, y: 14, depth: 0.35, blur: 0 },
  { label: "Construction", x: 76, y: 16, depth: 0.9, blur: 0 },
  { label: "Manufacturing", x: 3, y: 50, depth: 0.7, blur: 0 },
  { label: "Indonesia", x: 7, y: 82, depth: 0.28, blur: 2 },
  { label: "International markets", x: 74, y: 89, depth: 0.5, blur: 0 }
];

export function Overview() {
  return (
    <section
      className="sec tint ov-stage"
      id="overview"
      aria-labelledby="overview-title"
    >
      <div className="ov-pin">
        <div className="ov-bg" aria-hidden="true">
          <i className="ov-glow" />
          <i className="ov-lattice" />
        </div>
        <div className="ov-float" aria-hidden="true">
          {FLOATING_TERMS.map((term) => (
            <span
              key={term.label}
              className="ov-chip"
              data-x={term.x}
              data-y={term.y}
              data-depth={term.depth}
              data-blur={term.blur}
            >
              {term.label}
            </span>
          ))}
        </div>
        <div className="wrap">
          <div lang={overview.language} className="sec-head center">
            {/* the question is the heading; the script draws it as a large dot-matrix label */}
            <h2 className="ov-title" id="overview-title">
              <span className="eyebrow" data-dm-size="176">
                {overview.question}
              </span>
            </h2>
            <p className="lead ov-statement">{overview.answer}</p>
            <a className="tlink ov-cta" href="#how-it-works">
              See how ATLAS works
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
