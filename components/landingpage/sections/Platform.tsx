import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Platform() {
  return (
    <RevealSection className="sec dark" id="platform" aria-labelledby="plat-title">
      <div className="hero-bg" style={{ background: "radial-gradient(700px 500px at 20% 55%,rgba(124,58,237,.22),transparent 65%)" }} />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="plat-top">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              Platform
            </span>
            <h2 className="h2" id="plat-title">
              FABRIX connects. ONTRIX understands.
              {" "}
              <span className="grad">NEXA decides.</span>
            </h2>
          </div>
          <p className="lead">
            Every ATLAS application runs on the same three layers, so each new use case builds on the data, model and intelligence you already have.
          </p>
        </div>
        <div className="plat" style={{ marginTop: "48px" }}>
          <div className="plat-art" aria-hidden="true">
            <svg viewBox="0 0 520 660" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="pF" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#DDD6FE" stopOpacity=".55" />
                  <stop offset="1" stopColor="#A78BFA" stopOpacity=".22" />
                </linearGradient>
                <linearGradient id="pO" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#A78BFA" stopOpacity=".6" />
                  <stop offset="1" stopColor="#7C3AED" stopOpacity=".25" />
                </linearGradient>
                <linearGradient id="pN" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#7C3AED" stopOpacity=".75" />
                  <stop offset="1" stopColor="#4C1D95" stopOpacity=".45" />
                </linearGradient>
                <linearGradient id="pSide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5B21B6" stopOpacity=".7" />
                  <stop offset="1" stopColor="#1B1242" stopOpacity=".9" />
                </linearGradient>
                <radialGradient id="pGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#8B5CF6" stopOpacity=".45" />
                  <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="pDot" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset=".35" stopColor="#DDD6FE" stopOpacity=".9" />
                  <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="270" cy="330" rx="260" ry="250" fill="url(#pGlow)" />
              <line x1="105" y1="182" x2="105" y2="569" stroke="#C4B5FD" strokeOpacity=".35" strokeDasharray="2 6" />
              <line x1="280" y1="256" x2="280" y2="643" stroke="#C4B5FD" strokeOpacity=".35" strokeDasharray="2 6" />
              <line x1="455" y1="182" x2="455" y2="569" stroke="#C4B5FD" strokeOpacity=".35" strokeDasharray="2 6" />
              <g transform="translate(0 64)">
                <polygon points="105,505 280,579 280,593 105,519" fill="url(#pSide)" />
                <polygon points="455,505 280,579 280,593 455,519" fill="url(#pSide)" fillOpacity=".75" />
                <polygon points="280,431 455,505 280,579 105,505" fill="url(#pF)" stroke="#DDD6FE" strokeOpacity=".9" strokeWidth="1.2" />
                <g transform="matrix(1.8 0.7 -1.8 0.7 280 431)">
                  <line x1="10" y1="0" x2="10" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="20" y1="0" x2="20" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="30" y1="0" x2="30" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="40" y1="0" x2="40" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="60" y1="0" x2="60" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="60" x2="100" y2="60" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="70" y1="0" x2="70" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="70" x2="100" y2="70" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="80" y1="0" x2="80" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="90" y1="0" x2="90" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="90" x2="100" y2="90" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <rect x="15" y="15" width="14" height="14" rx="2" fill="#F5F3FF" fillOpacity=".55" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth=".6" />
                  <rect x="15" y="51" width="14" height="14" rx="2" fill="#F5F3FF" fillOpacity=".55" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth=".6" />
                  <rect x="51" y="15" width="14" height="14" rx="2" fill="#F5F3FF" fillOpacity=".55" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth=".6" />
                  <rect x="51" y="55" width="14" height="14" rx="2" fill="#F5F3FF" fillOpacity=".55" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth=".6" />
                  <rect x="73" y="33" width="14" height="14" rx="2" fill="#F5F3FF" fillOpacity=".55" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth=".6" />
                  <rect x="33" y="75" width="14" height="14" rx="2" fill="#F5F3FF" fillOpacity=".55" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth=".6" />
                  <path d="M22 22 L50 50 M22 58 L50 50 M58 22 L50 50 M58 62 L50 50 M80 40 L50 50 M40 82 L50 50" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth=".8" />
                  <circle cx="50" cy="50" r="6" fill="#FFFFFF" fillOpacity=".9" />
                </g>
                <g transform="translate(62.599999999999994 447)">
                  <rect width="84" height="26" rx="8" fill="#0B0820" stroke="#DDD6FE" strokeOpacity=".9" />
                  <circle cx="11" cy="13" r="3" fill="#DDD6FE" />
                  <text x="20" y="17.5" fontFamily="Manrope, system-ui, sans-serif" fontSize="12" fontWeight="600" letterSpacing="1" fill="#F4F1FF">
                    FABRIX
                  </text>
                </g>
                <text x="415" y="563" fontFamily="Manrope, system-ui, sans-serif" fontSize="12" letterSpacing=".3" fill="#DDD6FE" fillOpacity=".9">
                  Data
                </text>
              </g>
              <g transform="translate(0 35.5)">
                <polygon points="105,340 280,414 280,428 105,354" fill="url(#pSide)" />
                <polygon points="455,340 280,414 280,428 455,354" fill="url(#pSide)" fillOpacity=".75" />
                <polygon points="280,266 455,340 280,414 105,340" fill="url(#pO)" stroke="#A78BFA" strokeOpacity=".9" strokeWidth="1.2" />
                <g transform="matrix(1.8 0.7 -1.8 0.7 280 266)">
                  <line x1="10" y1="0" x2="10" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="20" y1="0" x2="20" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="30" y1="0" x2="30" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="40" y1="0" x2="40" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="60" y1="0" x2="60" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="60" x2="100" y2="60" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="70" y1="0" x2="70" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="70" x2="100" y2="70" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="80" y1="0" x2="80" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="90" y1="0" x2="90" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="90" x2="100" y2="90" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="20" y1="30" x2="45" y2="18" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="45" y1="18" x2="70" y2="30" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="20" y1="30" x2="30" y2="60" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="45" y1="18" x2="55" y2="50" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="70" y1="30" x2="55" y2="50" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="30" y1="60" x2="55" y2="50" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="55" y1="50" x2="80" y2="65" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="30" y1="60" x2="45" y2="82" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="45" y1="82" x2="80" y2="65" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="30" y1="60" x2="20" y2="80" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="45" y1="82" x2="20" y2="80" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <line x1="70" y1="30" x2="80" y2="65" stroke="#F5F3FF" strokeOpacity=".75" strokeWidth=".9" />
                  <circle cx="20" cy="30" r="3.4" fill="#FFFFFF" />
                  <circle cx="45" cy="18" r="3.4" fill="#FFFFFF" />
                  <circle cx="70" cy="30" r="3.4" fill="#FFFFFF" />
                  <circle cx="30" cy="60" r="3.4" fill="#FFFFFF" />
                  <circle cx="55" cy="50" r="3.4" fill="#FFFFFF" />
                  <circle cx="80" cy="65" r="3.4" fill="#FFFFFF" />
                  <circle cx="45" cy="82" r="3.4" fill="#FFFFFF" />
                  <circle cx="20" cy="80" r="3.4" fill="#FFFFFF" />
                </g>
                <g transform="translate(62.599999999999994 282)">
                  <rect width="84" height="26" rx="8" fill="#0B0820" stroke="#A78BFA" strokeOpacity=".9" />
                  <circle cx="11" cy="13" r="3" fill="#A78BFA" />
                  <text x="20" y="17.5" fontFamily="Manrope, system-ui, sans-serif" fontSize="12" fontWeight="600" letterSpacing="1" fill="#F4F1FF">
                    ONTRIX
                  </text>
                </g>
                <text x="415" y="398" fontFamily="Manrope, system-ui, sans-serif" fontSize="12" letterSpacing=".3" fill="#A78BFA" fillOpacity=".9">
                  Context
                </text>
              </g>
              <g transform="translate(0 7)">
                <polygon points="105,175 280,249 280,263 105,189" fill="url(#pSide)" />
                <polygon points="455,175 280,249 280,263 455,189" fill="url(#pSide)" fillOpacity=".75" />
                <polygon points="280,101 455,175 280,249 105,175" fill="url(#pN)" stroke="#8B5CF6" strokeOpacity=".9" strokeWidth="1.2" />
                <g transform="matrix(1.8 0.7 -1.8 0.7 280 101)">
                  <line x1="10" y1="0" x2="10" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="20" y1="0" x2="20" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="30" y1="0" x2="30" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="40" y1="0" x2="40" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="60" y1="0" x2="60" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="60" x2="100" y2="60" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="70" y1="0" x2="70" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="70" x2="100" y2="70" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="80" y1="0" x2="80" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="90" y1="0" x2="90" y2="100" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <line x1="0" y1="90" x2="100" y2="90" stroke="#FFFFFF" strokeOpacity=".1" strokeWidth=".6" />
                  <circle cx="30" cy="30" r="9" fill="none" stroke="#EDE9FE" strokeOpacity=".8" strokeWidth=".9" />
                  <circle cx="30" cy="30" r="3.1" fill="#FFFFFF" />
                  <circle cx="70" cy="30" r="7" fill="none" stroke="#EDE9FE" strokeOpacity=".8" strokeWidth=".9" />
                  <circle cx="70" cy="30" r="2.4" fill="#FFFFFF" />
                  <circle cx="50" cy="55" r="12" fill="none" stroke="#EDE9FE" strokeOpacity=".8" strokeWidth=".9" />
                  <circle cx="50" cy="55" r="4.2" fill="#FFFFFF" />
                  <circle cx="28" cy="74" r="7" fill="none" stroke="#EDE9FE" strokeOpacity=".8" strokeWidth=".9" />
                  <circle cx="28" cy="74" r="2.4" fill="#FFFFFF" />
                  <circle cx="74" cy="72" r="9" fill="none" stroke="#EDE9FE" strokeOpacity=".8" strokeWidth=".9" />
                  <circle cx="74" cy="72" r="3.1" fill="#FFFFFF" />
                  <path d="M30 30 L50 55 L70 30 M28 74 L50 55 L74 72" stroke="#EDE9FE" strokeOpacity=".6" strokeWidth=".8" />
                </g>
                <g transform="translate(79.4 117)">
                  <rect width="68" height="26" rx="8" fill="#0B0820" stroke="#8B5CF6" strokeOpacity=".9" />
                  <circle cx="11" cy="13" r="3" fill="#8B5CF6" />
                  <text x="20" y="17.5" fontFamily="Manrope, system-ui, sans-serif" fontSize="12" fontWeight="600" letterSpacing="1" fill="#F4F1FF">
                    NEXA
                  </text>
                </g>
                <text x="415" y="233" fontFamily="Manrope, system-ui, sans-serif" fontSize="12" letterSpacing=".3" fill="#8B5CF6" fillOpacity=".9">
                  Decisions
                </text>
              </g>
              <circle cx="105" cy="469.3" r="9" fill="url(#pDot)" />
              <circle cx="280" cy="515.2" r="9" fill="url(#pDot)" />
              <circle cx="455" cy="281.7" r="9" fill="url(#pDot)" />
              <circle cx="280" cy="315.8" r="9" fill="url(#pDot)" />
              <circle cx="105" cy="270.0" r="9" fill="url(#pDot)" />
            </svg>
          </div>
          <div className="layers">
            <article className="layer">
              <span className="layer-num">03</span>
              <div className="layer-body">
                <div className="layer-name">
                  <span className="layer-swatch" style={{ background: "#8B5CF6", boxShadow: "0 0 12px #8B5CF6" }} />
                  <h3>NEXA</h3>
                  <span className="lstep-tag">Decide</span>
                </div>
                <div className="layer-out">Turn context into decisions and actions</div>
                <p className="layer-desc">
                  Predictions, optimisation and workflow automation, with every recommendation explained and approved by people.
                </p>
              </div>
            </article>
            <article className="layer">
              <span className="layer-num">02</span>
              <div className="layer-body">
                <div className="layer-name">
                  <span className="layer-swatch" style={{ background: "#A78BFA", boxShadow: "0 0 12px #A78BFA" }} />
                  <h3>ONTRIX</h3>
                  <span className="lstep-tag">Understand</span>
                </div>
                <div className="layer-out">Give the data business meaning</div>
                <p className="layer-desc">
                  A shared operational model that links machines, orders, people and contracts, so every team works from the same reality.
                </p>
              </div>
            </article>
            <article className="layer">
              <span className="layer-num">01</span>
              <div className="layer-body">
                <div className="layer-name">
                  <span className="layer-swatch" style={{ background: "#DDD6FE", boxShadow: "0 0 12px #DDD6FE" }} />
                  <h3>FABRIX</h3>
                  <span className="lstep-tag">Connect</span>
                </div>
                <div className="layer-out">Connect your operational data</div>
                <p className="layer-desc">
                  Connectors, streaming and batch pipelines, and master data that keep one trusted version of every record.
                </p>
              </div>
            </article>
          </div>
        </div>
        <details className="tech">
          <summary>
            <span className="tsum">
              Explore technical architecture
              <span className="for-it">For IT / Data / AI teams</span>
            </span>
            <span className="pm">
              <Icon name="plus" size={16} />
            </span>
          </summary>
          <div className="tech-in">
            <div className="tech-col">
              <b>FABRIX</b>
              <ul>
                <li>
                  <b>Streaming &amp; processing:</b>
                  {" "}
                  Apache Kafka, Spark, Flink
                </li>
                <li>
                  <b>ETL/ELT:</b>
                  {" "}
                  Talend, Informatica
                </li>
                <li>
                  <b>Semantic mapping:</b>
                  {" "}
                  R2RML, SPARQL-Generate
                </li>
                <li>
                  <b>Storage:</b>
                  {" "}
                  RDF triplestore, medallion data lake, time-series DB
                </li>
              </ul>
            </div>
            <div className="tech-col">
              <b>ONTRIX</b>
              <ul>
                <li>
                  <b>Knowledge model:</b>
                  {" "}
                  W3C OWL 2, RDF 1.1
                </li>
                <li>
                  <b>Validation:</b>
                  {" "}
                  SHACL
                </li>
                <li>
                  <b>Query &amp; federation:</b>
                  {" "}
                  SPARQL 1.1, GeoSPARQL
                </li>
                <li>
                  <b>Vocabularies &amp; lineage:</b>
                  {" "}
                  SKOS, PROV-O
                </li>
              </ul>
            </div>
            <div className="tech-col">
              <b>NEXA</b>
              <ul>
                <li>
                  <b>Forecasting:</b>
                  {" "}
                  Prophet, LSTM, SARIMA
                </li>
                <li>
                  <b>ML:</b>
                  {" "}
                  XGBoost, Random Forest, TensorFlow, PyTorch
                </li>
                <li>
                  <b>Optimisation:</b>
                  {" "}
                  OR-Tools, CPLEX, Gurobi
                </li>
                <li>
                  <b>Vision &amp; explainability:</b>
                  {" "}
                  OpenCV, YOLO, SHAP, LIME
                </li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </RevealSection>
  );
}
