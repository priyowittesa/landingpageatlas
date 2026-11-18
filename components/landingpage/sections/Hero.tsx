import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Hero() {
  return (
    <RevealSection className="hero2 dark" aria-labelledby="hero-title">
      <div className="hero-media" aria-hidden="true">
        <video className="hero-video" muted loop playsInline autoPlay preload="auto" tabIndex={-1} disablePictureInPicture disableRemotePlayback>
          <source src="/video/hero-engine.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero-pic-wrap">
        <div className="hero-pic hero-pic-empty" role="presentation" />
        <div className="hero2-copy">
          <h1 className="h1" id="hero-title">
            The AI Operating Engine that
            {" "}
            <span className="grad">understands</span>
            {" "}
            your operations.
          </h1>
          <p className="hero2-sub">
            ATLAS connects your operational data, understands how your business works, and helps your teams make faster, explainable decisions.
          </p>
          <div className="hero2-ctas">
            <a className="btn btn-primary" href="#walkthrough">
              Book an ATLAS walkthrough
              <Icon name="arrow" size={18} />
            </a>
            <button className="btn btn-ghost js-demo" type="button">
              <span className="play">
                <Icon name="play" size={11} />
              </span>
              Watch ATLAS in action
            </button>
          </div>
        </div>
      </div>
      <div className="wrap">
        <div className="pillars">
          <div className="pillar">
            <span className="pi">
              <Icon name="plug" size={20} />
            </span>
            <div>
              <b>Connect existing systems</b>
              <span>ERP, MES, SCADA and IoT stay in place. ATLAS works on top of them.</span>
            </div>
          </div>
          <div className="pillar">
            <span className="pi">
              <Icon name="target" size={20} />
            </span>
            <div>
              <b>Start with one problem</b>
              <span>
                Run a Proof of Value on one line or process, then scale across sites.
              </span>
            </div>
          </div>
          <div className="pillar">
            <span className="pi">
              <Icon name="clock" size={20} />
            </span>
            <div>
              <b>Typical activation: 6–18 weeks</b>
              <span>Depending on systems, scope and data readiness.</span>
            </div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
