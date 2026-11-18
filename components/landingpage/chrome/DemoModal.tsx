import { Icon } from "../ui/Icon";

export function DemoModal() {
  return (
    <div className="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-t" hidden>
      <div className="modal-in">
        <div className="modal-bar">
          <b id="modal-t">ATLAS in action</b>
          <button className="x" type="button" id="modal-x" aria-label="Close video">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="video">
          <span className="bigplay">
            <Icon name="play" size={28} style={{ color: "#fff" }} />
          </span>
          <span>[Demo video embed goes here]</span>
        </div>
        <div className="modal-foot">
          <span>Want to see it with your own use case?</span>
          <a className="btn btn-primary btn-sm" href="#walkthrough" id="modal-cta">
            Book an ATLAS walkthrough
          </a>
        </div>
      </div>
    </div>
  );
}
