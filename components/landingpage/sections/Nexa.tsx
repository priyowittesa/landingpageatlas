/* eslint-disable @next/next/no-img-element -- static marketing images are served from /public as-is */
import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Nexa() {
  return (
    <RevealSection className="sec light" id="nexa" aria-labelledby="nexa-title">
      <div className="wrap">
        <div className="sec-head center">
          <span className="eyebrow eyebrow-n">
            <b>03</b>
            Decide · NEXA
          </span>
          <h2 className="h2" id="nexa-title">
            AI that recommends. People decide.
            {" "}
            <span className="grad-l">Every recommendation is explainable.</span>
          </h2>
          <p className="lead">
            Here is what a decision looks like in ATLAS: what changed, why it matters, what to do, the evidence behind it, and who approves it.
          </p>
        </div>
        <figure className="dc-shot">
          <img src="/images/prototypes/nexa-decision.webp" alt="NEXA recommending three prioritised actions, each with Take Action and Dismiss, and the sources it used" width="1800" height="1200" loading="lazy" decoding="async" />
        </figure>
        <div className="dc" style={{ display: "none" }} id="dc" aria-label="Example ATLAS decision">
          <div className="dc-top">
            <span className="rec-agent">
              <span className="pulse" />
              Predictive maintenance · Press Line 3
            </span>
            <span className="hitl" id="dc-status">
              <Icon name="users" size={15} />
              <span>Human approval required</span>
            </span>
          </div>
          <ol className="dsteps" aria-label="Decision steps" tabIndex={0}>
            <li className="dstep done">
              <span className="dot">
                <Icon name="check" size={14} />
              </span>
              <b>What changed</b>
            </li>
            <li className="dstep done">
              <span className="dot">
                <Icon name="check" size={14} />
              </span>
              <b>Why it matters</b>
            </li>
            <li className="dstep done">
              <span className="dot">
                <Icon name="check" size={14} />
              </span>
              <b>What ATLAS recommends</b>
            </li>
            <li className="dstep done">
              <span className="dot">
                <Icon name="check" size={14} />
              </span>
              <b>Evidence</b>
            </li>
            <li className="dstep hl" id="ds-appr">
              <span className="dot">5</span>
              <b>Human approval</b>
            </li>
            <li className="dstep" id="ds-res">
              <span className="dot">6</span>
              <b>Result</b>
            </li>
          </ol>
          <div className="dgrid">
            <div className="dpanel">
              <small>1 · WHAT CHANGED</small>
              <h4>Vibration on sensor S‑12 up 38% in 7 days</h4>
              <p>Last bearing change was 11 months ago.</p>
            </div>
            <div className="dpanel">
              <small>2 · WHY IT MATTERS</small>
              <h4>Bearing failure likely within 5 days</h4>
              <div className="rec-meta">
                <span className="pill pill-red">
                  <Icon name="alert" size={14} />
                  High priority
                </span>
                <span className="pill pill-p">Confidence 87%</span>
              </div>
              <p style={{ marginTop: "8px" }}>Order #4471 runs on this line on Friday.</p>
            </div>
            <div className="dpanel">
              <small>3 · WHAT ATLAS RECOMMENDS</small>
              <h4>Schedule preventive maintenance on Thursday night shift</h4>
              <p>Reserve Bearing 6205 from store (2 in stock).</p>
            </div>
            <div className="dpanel">
              <small>4 · EVIDENCE</small>
              <p>
                <b style={{ color: "#fff" }}>Rule:</b>
                {" "}
                maintenance required + high priority → escalate to Maintenance Manager.
              </p>
              <div className="shap" aria-label="Top model drivers">
                <div>
                  <span>Vibration RMS</span>
                  <i style={{ width: "88px" }} />
                </div>
                <div>
                  <span>Temperature</span>
                  <i style={{ width: "56px" }} />
                </div>
                <div>
                  <span>Run hours</span>
                  <i style={{ width: "38px" }} />
                </div>
              </div>
            </div>
            <div className="dpanel hl" id="dp-appr">
              <small>5 · HUMAN APPROVAL</small>
              <h4 id="appr-h">Awaiting Maintenance Manager</h4>
              <div className="rec-btns" id="appr-btns">
                <button className="btn btn-primary btn-sm" type="button" id="btn-approve">
                  <Icon name="check" size={16} />
                  Approve
                </button>
                <button className="btn btn-ghost btn-sm" type="button">
                  Assign to engineer
                </button>
              </div>
              <p id="appr-done" hidden>
                Approved 07:42 by the Maintenance Manager.
                {" "}
                <button type="button" className="linkbtn" id="btn-reset">Reset example</button>
              </p>
            </div>
            <div className="dpanel res" id="dp-res">
              <small>
                6 · RESULT
                <span className="anchor-mini">04 Act &amp; Learn</span>
              </small>
              <ul className="alist" id="res-list">
                <li>
                  <Icon name="clock" size={15} />
                  Work order will be created in your maintenance system
                </li>
                <li>
                  <Icon name="clock" size={15} />
                  Technician scheduled for night shift
                </li>
                <li>
                  <Icon name="clock" size={15} />
                  Spare part reserved
                </li>
              </ul>
            </div>
          </div>
        </div>
        <details className="tech">
          <summary>
            <span className="tsum">
              Models and techniques behind NEXA
              <span className="for-it">For IT / Data / AI teams</span>
            </span>
            <span className="pm">
              <Icon name="plus" size={16} />
            </span>
          </summary>
          <div className="tech-in">
            <div className="tech-col">
              <b>Predict</b>
              <ul>
                <li>
                  <b>Forecasting:</b>
                  {" "}
                  Prophet, LSTM, SARIMA
                </li>
                <li>
                  <b>Classification &amp; regression:</b>
                  {" "}
                  XGBoost, Random Forest, neural networks
                </li>
              </ul>
            </div>
            <div className="tech-col">
              <b>Detect</b>
              <ul>
                <li>
                  <b>Anomalies:</b>
                  {" "}
                  Isolation Forest, autoencoders
                </li>
                <li>
                  <b>Computer vision:</b>
                  {" "}
                  OpenCV, YOLO
                </li>
              </ul>
            </div>
            <div className="tech-col">
              <b>OPTIMISE &amp; EXPLAIN</b>
              <ul>
                <li>
                  <b>Solvers:</b>
                  {" "}
                  OR-Tools, CPLEX, Gurobi
                </li>
                <li>
                  <b>Explainability:</b>
                  {" "}
                  SHAP, LIME
                </li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </RevealSection>
  );
}
