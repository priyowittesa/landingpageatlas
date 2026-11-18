import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Problem() {
  return (
    <RevealSection className="sec light sec-tight-top" aria-labelledby="prob-title">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">
            <span className="dot" />
            The problem
          </span>
          <h2 className="h2" id="prob-title">
            Your data is everywhere. Your decisions are still manual.
          </h2>
          <p className="lead">
            Industrial teams run on dozens of disconnected systems. Reports arrive late, every department defines the same asset differently, and AI tools can’t explain what they recommend.
          </p>
        </div>
        <div className="prob-grid snap" tabIndex={0} role="region" aria-label="Three operational problems">
          <article className="pcard">
            <span className="ico">
              <Icon name="db" size={22} />
            </span>
            <h3>Disconnected operations</h3>
            <p className="pc-lead">Data exists but cannot work together.</p>
            <p>
              Production, maintenance, quality and procurement live in separate systems.
            </p>
            <div className="tags">
              <span>ERP</span>
              <span>SCADA</span>
              <span>IoT sensors</span>
              <span>Spreadsheets</span>
              <span>Paper logs</span>
            </div>
          </article>
          <article className="pcard">
            <span className="ico">
              <Icon name="bars" size={22} />
            </span>
            <h3>Visibility without understanding</h3>
            <p className="pc-lead">Dashboards show what happened, not what to do.</p>
            <p>
              Nobody can see how a failing machine affects orders, spares and the next shift.
            </p>
            <div className="tags">
              <span>Late reports</span>
              <span>Manual joins</span>
              <span>Conflicting KPIs</span>
            </div>
          </article>
          <article className="pcard">
            <span className="ico">
              <Icon name="box" size={22} />
            </span>
            <h3>AI without operational trust</h3>
            <p className="pc-lead">
              Recommendations cannot be traced to operational evidence.
            </p>
            <p>Managers don’t act on them and auditors can’t sign off.</p>
            <div className="tags">
              <span>No evidence</span>
              <span>No audit trail</span>
              <span>Low adoption</span>
            </div>
          </article>
        </div>
        <div className="shift">
          <div className="shift-head">
            <h3>
              How operations change with
              {" "}
              <span className="grad-l">ATLAS</span>
            </h3>
            <p>
              The same plant, the same systems. What changes is how fast your teams see, decide and act.
            </p>
          </div>
          <div className="shift-cols" aria-hidden="true">
            <div className="b">Without ATLAS</div>
            <div className="a">With ATLAS</div>
          </div>
          <div className="shift-row">
            <div className="b">
              <Icon name="x" size={18} style={{ color: "#8A84A3" }} />
              <span>
                <span className="sr">Without ATLAS:</span>
                Data copied between systems by hand every week
              </span>
            </div>
            <div className="a">
              <Icon name="arrow" size={16} className="arr" />
              <span>
                <span className="sr">With ATLAS:</span>
                Connectors bring every source into one trusted view
              </span>
              <span className="lchip">FABRIX</span>
            </div>
          </div>
          <div className="shift-row">
            <div className="b">
              <Icon name="x" size={18} style={{ color: "#8A84A3" }} />
              <span>
                <span className="sr">Without ATLAS:</span>
                Each team keeps its own version of “the asset list”
              </span>
            </div>
            <div className="a">
              <Icon name="arrow" size={16} className="arr" />
              <span>
                <span className="sr">With ATLAS:</span>
                One shared operational model: one meaning for every asset
              </span>
              <span className="lchip">ONTRIX</span>
            </div>
          </div>
          <div className="shift-row">
            <div className="b">
              <Icon name="x" size={18} style={{ color: "#8A84A3" }} />
              <span>
                <span className="sr">Without ATLAS:</span>
                Decisions nobody can trace afterwards
              </span>
            </div>
            <div className="a">
              <Icon name="arrow" size={16} className="arr" />
              <span>
                <span className="sr">With ATLAS:</span>
                Every decision shows the evidence behind it
              </span>
              <span className="lchip">ONTRIX + NEXA</span>
            </div>
          </div>
          <div className="shift-row">
            <div className="b">
              <Icon name="x" size={18} style={{ color: "#8A84A3" }} />
              <span>
                <span className="sr">Without ATLAS:</span>
                Problems found after downtime has already happened
              </span>
            </div>
            <div className="a">
              <Icon name="arrow" size={16} className="arr" />
              <span>
                <span className="sr">With ATLAS:</span>
                Risks flagged early, with a recommended next action
              </span>
              <span className="lchip">NEXA</span>
            </div>
          </div>
          <div className="shift-row">
            <div className="b">
              <Icon name="x" size={18} style={{ color: "#8A84A3" }} />
              <span>
                <span className="sr">Without ATLAS:</span>
                AI pilots that never reach the shop floor
              </span>
            </div>
            <div className="a">
              <Icon name="arrow" size={16} className="arr" />
              <span>
                <span className="sr">With ATLAS:</span>
                Recommendations supervisors can approve and act on
              </span>
              <span className="lchip">NEXA</span>
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
