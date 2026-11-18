import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Solutions() {
  return (
    <RevealSection className="sec light" id="solutions" aria-labelledby="sol-title">
      <div className="wrap">
        <div className="apps-top">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot" />
              Applications
            </span>
            <h2 className="h2" id="sol-title">
              Start with the problem you need to solve.
            </h2>
          </div>
          <p className="lead" style={{ maxWidth: "440px" }}>
            Pick a business function. Every application runs on the same ATLAS engine, so you can start with one and add more when you’re ready.
          </p>
        </div>
        <div className="sol" id="industries">
          <div className="sol-tabs" id="bf-fn" role="tablist" aria-orientation="vertical" aria-label="Business function" />
          <div className="sol-panel" id="sol-panel" role="tabpanel" tabIndex={0}>
            <div className="sol-head" id="bf-count" aria-live="polite" />
            <div id="apps-ind" />
          </div>
        </div>
        <p className="inlink" hidden>
          <a href="#walkthrough">
            Not sure where to start? Book an ATLAS walkthrough for your use case
            <Icon name="arrow" size={15} />
          </a>
        </p>
      </div>
    </RevealSection>
  );
}
