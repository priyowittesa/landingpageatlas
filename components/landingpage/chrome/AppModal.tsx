import { Icon } from "../ui/Icon";

// Filled in by the applications browser (see public/atlas-landing.js, openApp).
export function AppModal() {
  return (
    <div className="modal" id="app-modal" role="dialog" aria-modal="true" aria-labelledby="am-name" hidden>
      <div className="modal-in am">
        <div className="am-head">
          <span className="app-mark" id="am-mark" aria-hidden="true" />
          <div>
            <h3 id="am-name" />
            <small id="am-full" />
          </div>
          <button className="x" type="button" id="am-x" aria-label="Close application details">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="am-body">
          <p className="am-out" id="am-out" />
          <p className="am-desc" id="am-desc" />
          <div className="am-meta">
            <div>
              <small>Industry</small>
              <b id="am-ind" />
            </div>
            <div>
              <small>Business function</small>
              <b id="am-fn" />
            </div>
          </div>
          <small className="am-k">Key capabilities</small>
          <ul className="am-caps" id="am-caps" />
          <p className="am-note">
            Runs on the same ATLAS engine: FABRIX connects the data, ONTRIX gives it context and NEXA turns it into decisions.
          </p>
        </div>
        <div className="modal-foot">
          <span>See it with your own operation</span>
          <a className="btn btn-primary btn-sm" href="#walkthrough" id="am-cta">
            Book an ATLAS walkthrough
          </a>
        </div>
      </div>
    </div>
  );
}
