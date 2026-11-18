import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Pricing() {
  return (
    <RevealSection className="sec dark" id="pricing" aria-labelledby="price-title">
      <div className="wrap">
        <div className="sec-head center">
          <span className="eyebrow">
            <span className="dot" />
            Pricing
          </span>
          <h2 className="h2" id="price-title">
            No fixed packages. Build ATLAS around your problem.
          </h2>
          <p className="lead">
            Every ATLAS is custom. Pick the applications that solve your challenges, from maintenance to supply chain, and we will quote exactly what you need.
          </p>
          <div className="unit-tip" hidden>
            <button type="button" className="tip-btn" id="tip-btn" aria-expanded="false" aria-controls="tip-site">
              <Icon name="info" size={15} />
              What counts as a site?
            </button>
            <div className="tip-pop" id="tip-site" role="note" hidden>
              <b>One site = one operation run as a single unit.</b>
              In manufacturing a site is usually a plant; in mining, a mine or contract site. Several buildings on one campus count as one site.
              {" "}
              <a href="#faq-site" className="js-site">Read more</a>
            </div>
          </div>
        </div>
        <div className="cfg" id="cfg">
          <div className="cfg-side">
            <aside className="cfg-sum" id="cfg-sum" aria-live="polite" aria-label="Your configuration">
              <div className="cfg-sh">
                <small>Your ATLAS</small>
                <b id="cfg-count">Nothing selected yet</b>
              </div>
              <div className="cfg-base">
                <Icon name="check" size={14} />
                <span>
                  <b>ATLAS Foundation</b>
                  {" "}
                  always included
                </span>
              </div>
              <ul className="cfg-list" id="cfg-list" />
              <p className="cfg-empty" id="cfg-empty">
                Pick a whole business function or choose applications one by one. You can change everything later.
              </p>
              <a className="btn btn-primary btn-block js-quote" href="#walkthrough">
                Request a quote for this setup
              </a>
              <span className="cfg-fine">
                No commitment. We scope it with your team before any quote.
              </span>
            </aside>
          </div>
          <div className="cfg-fns" id="cfg-fns" aria-label="Choose your applications" />
        </div>
        <div className="bespoke incl">
          <span className="ti">
            <Icon name="check" size={18} />
          </span>
          <div>
            <b>Included in every ATLAS: Foundation</b>
            <p>
              Data connectors, operational data model, KPI dashboards, offline mobile capture and WhatsApp digest. Unlimited users with no per-user fees, priced per site and not per seat.
            </p>
          </div>
        </div>
        <div className="p-factors">
          <b className="pf-h">What shapes your quote</b>
          <ul className="pf-l">
            <li>
              <Icon name="sliders" size={18} />
              <div>
                <b>Package scope</b>
                <span>The capabilities you need to solve your problem</span>
              </div>
            </li>
            <li>
              <Icon name="bars" size={18} />
              <div>
                <b>Number of sites</b>
                <span>One plant, or the same setup rolled out across many</span>
              </div>
            </li>
            <li>
              <Icon name="plug" size={18} />
              <div>
                <b>Integrations</b>
                <span>The ERP, MES and plant systems we connect to</span>
              </div>
            </li>
            <li>
              <Icon name="shield" size={18} />
              <div>
                <b>Deployment &amp; support</b>
                <span>Cloud, private cloud or on-premise, and support level</span>
              </div>
            </li>
          </ul>
          <a className="btn btn-primary" href="#walkthrough">
            Talk to us about your setup
          </a>
        </div>
      </div>
    </RevealSection>
  );
}
