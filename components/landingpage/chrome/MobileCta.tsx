import { Icon } from "../ui/Icon";

export function MobileCta() {
  return (
    <div className="mcta" id="mcta" role="complementary" aria-label="Quick booking">
      <a className="btn btn-primary" href="#walkthrough" aria-label="Book an ATLAS walkthrough">
        Book walkthrough
      </a>
      <button className="mcta-x" type="button" id="mcta-x" aria-label="Hide booking button">
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
