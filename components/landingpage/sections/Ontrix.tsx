import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Ontrix() {
  return (
    <RevealSection className="sec tint" id="ontrix" aria-labelledby="onto-title">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow eyebrow-n">
            <b>02</b>
            Understand · ONTRIX
          </span>
          <h2 className="h2" id="onto-title">
            Give AI a shared understanding of
            {" "}
            <span className="grad-l">your operations.</span>
          </h2>
          <p className="lead">
            Think of ONTRIX as a shared map of how your business works. Machines, orders, parts and suppliers are connected, so when one thing changes, ATLAS knows what else is affected.
          </p>
          <p className="onto-ex">
            <span className="ex-tag">Example · Manufacturing maintenance</span>
            A vibration sensor is linked to the press it monitors. The press is linked to its open work orders, the spare bearing it needs, the supplier of that bearing and the production orders it runs. When the sensor spikes, ATLAS follows those links to show the maintenance team exactly what is at risk.
          </p>
        </div>
        <div className="og" id="og">
          <div className="og-graph" aria-hidden="true">
            <div className="panel-bar">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
              <span>ONTRIX · Operational model</span>
              <span style={{ color: "#6EE7B7" }}>● LIVE</span>
            </div>
            <svg viewBox="0 0 760 450" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="ogDots" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#A78BFA" fillOpacity=".18" />
                </pattern>
                <radialGradient id="ogHalo" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#8B5CF6" stopOpacity=".45" />
                  <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="760" height="450" fill="url(#ogDots)" />
              <circle cx="380" cy="215" r="150" fill="url(#ogHalo)" />
              <g className="edges">
                <g className="edge" id="e-ms">
                  <line x1="380" y1="215" x2="140" y2="95" />
                  <g transform="translate(206 139)">
                    <rect width="104" height="22" rx="7" />
                    <text x="52" y="15">monitored by</text>
                  </g>
                </g>
                <g className="edge" id="e-mw">
                  <line x1="380" y1="215" x2="620" y2="95" />
                  <g transform="translate(466 139)">
                    <rect width="78" height="22" rx="7" />
                    <text x="39" y="15">requires</text>
                  </g>
                </g>
                <g className="edge" id="e-wp">
                  <line x1="620" y1="95" x2="620" y2="250" />
                  <g transform="translate(590 158)">
                    <rect width="60" height="22" rx="7" />
                    <text x="30" y="15">needs</text>
                  </g>
                </g>
                <g className="edge" id="e-ps">
                  <line x1="620" y1="250" x2="620" y2="395" />
                  <g transform="translate(568 311)">
                    <rect width="104" height="22" rx="7" />
                    <text x="52" y="15">sourced from</text>
                  </g>
                </g>
                <g className="edge" id="e-mp">
                  <line x1="380" y1="215" x2="140" y2="345" />
                  <g transform="translate(232 269)">
                    <rect width="46" height="22" rx="7" />
                    <text x="23" y="15">runs</text>
                  </g>
                </g>
              </g>
              <g className="nodes">
                <g className="node" id="n-sensor" transform="translate(50 66)">
                  <rect width="180" height="58" rx="13" />
                  <text className="t" x="16" y="22">Sensor</text>
                  <text className="n" x="16" y="43">Vibration S-12</text>
                  <g className="bdg">
                    <circle cx="180" cy="0" r="12" />
                    <text x="180" y="4" />
                  </g>
                </g>
                <g className="node main" id="n-machine" transform="translate(290 186)">
                  <rect width="180" height="58" rx="13" />
                  <text className="t" x="16" y="22">Machine</text>
                  <text className="n" x="16" y="43">Press Line 3</text>
                  <g className="bdg">
                    <circle cx="180" cy="0" r="12" />
                    <text x="180" y="4" />
                  </g>
                </g>
                <g className="node" id="n-wo" transform="translate(530 66)">
                  <rect width="180" height="58" rx="13" />
                  <text className="t" x="16" y="22">Work order</text>
                  <text className="n" x="16" y="43">Preventive maint.</text>
                  <g className="bdg">
                    <circle cx="180" cy="0" r="12" />
                    <text x="180" y="4" />
                  </g>
                </g>
                <g className="node" id="n-part" transform="translate(530 221)">
                  <rect width="180" height="58" rx="13" />
                  <text className="t" x="16" y="22">Spare part</text>
                  <text className="n" x="16" y="43">Bearing 6205</text>
                  <g className="bdg">
                    <circle cx="180" cy="0" r="12" />
                    <text x="180" y="4" />
                  </g>
                </g>
                <g className="node" id="n-supplier" transform="translate(530 366)">
                  <rect width="180" height="58" rx="13" />
                  <text className="t" x="16" y="22">Supplier</text>
                  <text className="n" x="16" y="43">Bearing supplier</text>
                  <g className="bdg">
                    <circle cx="180" cy="0" r="12" />
                    <text x="180" y="4" />
                  </g>
                </g>
                <g className="node" id="n-prod" transform="translate(50 316)">
                  <rect width="180" height="58" rx="13" />
                  <text className="t" x="16" y="22">Production order</text>
                  <text className="n" x="16" y="43">Order #4471</text>
                  <g className="bdg">
                    <circle cx="180" cy="0" r="12" />
                    <text x="180" y="4" />
                  </g>
                </g>
              </g>
            </svg>
          </div>
          <div className="og-side">
            <div className="og-q" id="og-q">What happens when…</div>
            <div className="og-tabs" role="tablist" aria-labelledby="og-q" id="og-tabs" />
            <div className="og-trace">How ATLAS knew this</div>
            <ol className="og-steps" id="og-steps" aria-live="polite" />
            <div className="og-rule">
              <span className="rule-tag">RULE</span>
              <code id="og-rule" />
            </div>
          </div>
        </div>
        <div className="cmp2" role="table" aria-label="Traditional analytics compared with ATLAS">
          <div className="cmp2-row cmp2-head" role="row">
            <div className="a" role="columnheader">Traditional analytics</div>
            <div className="b" role="columnheader">ATLAS</div>
          </div>
          <div className="cmp2-row" role="row">
            <div className="a" role="cell">
              <span className="sr">Traditional:</span>
              Tables
            </div>
            <div className="b" role="cell">
              <Icon name="check" size={18} style={{ color: "#7C3AED" }} />
              <span className="sr">ATLAS:</span>
              Operational objects
            </div>
          </div>
          <div className="cmp2-row" role="row">
            <div className="a" role="cell">
              <span className="sr">Traditional:</span>
              Report-specific definitions
            </div>
            <div className="b" role="cell">
              <Icon name="check" size={18} style={{ color: "#7C3AED" }} />
              <span className="sr">ATLAS:</span>
              Shared business meaning
            </div>
          </div>
          <div className="cmp2-row" role="row">
            <div className="a" role="cell">
              <span className="sr">Traditional:</span>
              Manual joins
            </div>
            <div className="b" role="cell">
              <Icon name="check" size={18} style={{ color: "#7C3AED" }} />
              <span className="sr">ATLAS:</span>
              Connected relationships
            </div>
          </div>
          <div className="cmp2-row" role="row">
            <div className="a" role="cell">
              <span className="sr">Traditional:</span>
              Scripts
            </div>
            <div className="b" role="cell">
              <Icon name="check" size={18} style={{ color: "#7C3AED" }} />
              <span className="sr">ATLAS:</span>
              Live operational rules
            </div>
          </div>
          <div className="cmp2-row" role="row">
            <div className="a" role="cell">
              <span className="sr">Traditional:</span>
              Numbers
            </div>
            <div className="b" role="cell">
              <Icon name="check" size={18} style={{ color: "#7C3AED" }} />
              <span className="sr">ATLAS:</span>
              Traceable evidence
            </div>
          </div>
        </div>
        <details className="tech">
          <summary>
            <span className="tsum">
              Technical standards
              <span className="for-it">For IT / Data / AI teams</span>
            </span>
            <span className="pm">
              <Icon name="plus" size={16} />
            </span>
          </summary>
          <div className="tech-in">
            <div className="tech-col">
              <b>Model</b>
              <ul>
                <li>
                  <b>OWL 2:</b>
                  {" "}
                  expressive knowledge representation with decidable reasoning
                </li>
                <li>
                  <b>SKOS:</b>
                  {" "}
                  controlled vocabularies and taxonomies
                </li>
              </ul>
            </div>
            <div className="tech-col">
              <b>VALIDATE &amp; QUERY</b>
              <ul>
                <li>
                  <b>SHACL:</b>
                  {" "}
                  validates data against the model as it arrives
                </li>
                <li>
                  <b>SPARQL:</b>
                  {" "}
                  graph traversal, aggregation and federation
                </li>
              </ul>
            </div>
            <div className="tech-col">
              <b>Trace</b>
              <ul>
                <li>
                  <b>PROV-O:</b>
                  {" "}
                  data lineage, transformation history and decision audit trails
                </li>
                <li>
                  <b>Domain extensions:</b>
                  {" "}
                  manufacturing, logistics (GeoSPARQL), energy (SOSA/SSN)
                </li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </RevealSection>
  );
}
