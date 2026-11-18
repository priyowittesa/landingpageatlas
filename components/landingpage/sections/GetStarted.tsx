import { RevealSection } from "./RevealSection";

export function GetStarted() {
  return (
    <RevealSection className="sec dark" id="get-started" aria-labelledby="start-title">
      <div className="hero-bg" style={{ background: "radial-gradient(800px 420px at 50% 0%,rgba(124,58,237,.25),transparent 70%)" }} />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="sub-block" id="activation">
          <div className="sub-block-h">
            <div className="sub-block-t">
              <span className="eyebrow">
                <span className="dot" />
                Get started
              </span>
              <h2 id="start-title">How do we get started?</h2>
            </div>
            <p>
              ATLAS is activated in focused steps. Each one delivers value before the next begins.
            </p>
          </div>
          <div className="phases" style={{ marginTop: "0" }}>
            <div className="phase">
              <div className="phase-n">
                <b style={{ background: "#DDD6FE", color: "#140F2E" }}>1</b>
                <span>Step one</span>
              </div>
              <h4>Connect your operations</h4>
              <p>
                Map data sources, set up connectors, align identity and security, and go live with baseline dashboards.
              </p>
            </div>
            <div className="phase">
              <div className="phase-n">
                <b style={{ background: "#A78BFA", color: "#140F2E" }}>2</b>
                <span>Step two</span>
              </div>
              <h4>Model how your business works</h4>
              <p>
                Build your operational model: objects, business events, approval paths and role-based views.
              </p>
            </div>
            <div className="phase">
              <div className="phase-n">
                <b style={{ background: "#7C3AED" }}>3</b>
                <span>Step three</span>
              </div>
              <h4>Activate AI and workflows</h4>
              <p>
                Switch on predictions, recommendations, exception handling, workflow triggers and feedback loops.
              </p>
            </div>
          </div>
          <div className="headline-num">
            <span className="n">
              6–18
              <span>weeks</span>
            </span>
            <p>
              <b>Typical initial activation: 6–18 weeks</b>
              , depending on systems, scope and data readiness.
            </p>
          </div>
          <div className="gantt" style={{ marginTop: "48px" }} aria-label="Typical initial activation time by sector, in weeks">
            <div className="gantt-h">
              <h3>Typical initial activation by sector</h3>
              <span>Weeks from kick-off to initial activation</span>
            </div>
            <div className="g-legend" aria-hidden="true">
              <span>
                <i className="lg-fast" />
                Fastest case
              </span>
              <span>
                <i className="lg-range" />
                Up to the longest case
              </span>
            </div>
            <div id="gantt" />
            <div className="g-axis">
              <span className="sp" />
              <div className="ax" id="gaxis" />
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
