/* eslint-disable @next/next/no-img-element -- static marketing images are served from /public as-is */
import type { CSSProperties } from "react";
import { INDUSTRIES } from "../data/industries";
import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

// Screenshots below the first two load lazily; the stage opens on the first.
const EAGER_IMAGE_COUNT = 2;

export function InAction() {
  return (
    <RevealSection className="sec tint" id="in-action" aria-labelledby="proto-title">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">
            <span className="dot" />
            ATLAS in action
          </span>
          <h2 className="h2" id="proto-title">See ATLAS in your kind of operation.</h2>
          <p className="lead">
            Example screens from different industries. Each one shows how ATLAS connects data, builds context and recommends action.
          </p>
        </div>
        <div className="stage dark" data-stage="">
          <div className="stage-glow" aria-hidden="true" />
          <div className="stage-top">
            <div className="stage-rail" role="tablist" aria-label="Industries">
              {INDUSTRIES.map((industry, index) => (
                <button
                  key={industry.id}
                  type="button"
                  role="tab"
                  className={index === 0 ? "stage-tab on" : "stage-tab"}
                  id={`st-${industry.id}`}
                  aria-controls={`sp-${industry.id}`}
                  aria-selected={index === 0 ? "true" : "false"}
                  tabIndex={index === 0 ? 0 : -1}
                >
                  <span>{industry.name}</span>
                  <span className="stage-bar" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <div className="stage-names">
            {INDUSTRIES.map((industry, index) => (
              <h3 key={industry.id} className={index === 0 ? "stage-name on" : "stage-name"}>
                <span>{industry.name}</span>
              </h3>
            ))}
          </div>
          <div className="stage-body">
            <div className="stage-side">
              <div className="stage-descs">
                {INDUSTRIES.map((industry, index) => (
                  <div
                    key={industry.id}
                    className={index === 0 ? "stage-tp on" : "stage-tp"}
                    role="tabpanel"
                    id={`sp-${industry.id}`}
                    aria-labelledby={`st-${industry.id}`}
                    data-accent={industry.accent}
                  >
                    <span className="chip">{industry.chip}</span>
                    <p>{industry.description}</p>
                  </div>
                ))}
              </div>
              <div className="stage-ctl">
                <button type="button" className="stage-prev" aria-label="Previous industry">
                  <Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} />
                </button>
                <button type="button" className="stage-next" aria-label="Next industry">
                  <Icon name="arrow" size={16} />
                </button>
              </div>
            </div>
            <div className="stage-deckwrap">
              <div className="stage-deck">
                {INDUSTRIES.map((industry, index) => (
                  <figure
                    key={industry.id}
                    className="deck-win"
                    data-pos={index}
                    style={{ "--rel": String(index) } as CSSProperties}
                  >
                    <div className="stage-chrome" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <span>ATLAS · {industry.name}</span>
                    </div>
                    <img
                      src={industry.image.src}
                      alt={industry.image.alt}
                      width={industry.image.width}
                      height={industry.image.height}
                      loading={index < EAGER_IMAGE_COUNT ? undefined : "lazy"}
                      decoding="async"
                    />
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="stage-foot" hidden>
          Not on the list? We will walk you through ATLAS on your own operation.
          {" "}
          <a className="tlink" href="#walkthrough">
            Book an ATLAS walkthrough
            <Icon name="arrow" size={16} />
          </a>
        </p>
      </div>
    </RevealSection>
  );
}
