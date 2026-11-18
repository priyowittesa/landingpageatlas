import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function HowItWorks() {
  return (
    <RevealSection className="sec dark" id="how-it-works" aria-labelledby="how-title">
      <div className="hero-bg" style={{ background: "radial-gradient(800px 460px at 50% 0%,rgba(124,58,237,.25),transparent 70%)" }} />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="sec-head center">
          <span className="eyebrow">
            <span className="dot" />
            How ATLAS works
          </span>
          <h2 className="h2" id="how-title">
            Connect. Understand.
            {" "}
            <span className="grad">Decide. Act &amp; Learn.</span>
          </h2>
          <p className="lead">
            One continuous loop turns scattered operational data into decisions your teams can act on, and gets smarter with every outcome.
          </p>
        </div>
        <ol className="loop4" aria-label="The ATLAS operating model">
          <li className="lstep">
            <div className="lk">
              <span className="ln">01</span>
              <span className="lflow">Data</span>
            </div>
            <span className="lico">
              <Icon name="plug" size={26} />
            </span>
            <h3>Connect</h3>
            <div className="lby">
              with
              {" "}
              <b>FABRIX</b>
            </div>
            <p>
              Bring ERP, MES, SCADA, IoT and spreadsheet data together, validated and de-duplicated.
            </p>
            <span className="chev" aria-hidden="true">
              <Icon name="arrow" size={16} />
            </span>
          </li>
          <li className="lstep">
            <div className="lk">
              <span className="ln">02</span>
              <span className="lflow">Context</span>
            </div>
            <span className="lico">
              <Icon name="nodes" size={26} />
            </span>
            <h3>Understand</h3>
            <div className="lby">
              with
              {" "}
              <b>ONTRIX</b>
            </div>
            <p>
              Model how your business works: machines, orders, people and events, all linked.
            </p>
            <span className="chev" aria-hidden="true">
              <Icon name="arrow" size={16} />
            </span>
          </li>
          <li className="lstep">
            <div className="lk">
              <span className="ln">03</span>
              <span className="lflow">Decision</span>
            </div>
            <span className="lico">
              <Icon name="spark" size={26} />
            </span>
            <h3>Decide</h3>
            <div className="lby">
              with
              {" "}
              <b>NEXA</b>
            </div>
            <p>Get prioritised recommendations, each with the evidence behind it.</p>
            <span className="chev" aria-hidden="true">
              <Icon name="arrow" size={16} />
            </span>
          </li>
          <li className="lstep">
            <div className="lk">
              <span className="ln">04</span>
              <span className="lflow">Action</span>
            </div>
            <span className="lico">
              <Icon name="loop" size={26} />
            </span>
            <h3>Act &amp; Learn</h3>
            <div className="lby">
              with
              {" "}
              <b>Workflows</b>
            </div>
            <p>
              Approved actions trigger workflows. Outcomes flow back, so every decision improves the next.
            </p>
            <span className="lback">
              <Icon name="loop" size={14} />
              Outcomes return to Connect as new data
            </span>
          </li>
        </ol>
        <div className="loopback" aria-label="Closed loop: the outcome of every action returns to Connect as new data">
          <span className="lb-path" aria-hidden="true">
            <span className="lb-head" />
            <span className="lb-dot" />
          </span>
          <span className="lb-label">
            <Icon name="loop" size={15} />
            <b>New data</b>
            <span>
              Outcomes flow back to Connect. Models retrain and the operational model evolves.
            </span>
          </span>
        </div>
      </div>
    </RevealSection>
  );
}
