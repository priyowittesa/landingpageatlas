import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Walkthrough() {
  return (
    <RevealSection className="dark cta" id="walkthrough" aria-labelledby="cta-title">
      <div className="wrap">
        <div className="cta-box">
          <div className="cta-copy">
            <span className="eyebrow">
              <span className="dot" />
              Book an ATLAS walkthrough
            </span>
            <h2 className="h2" id="cta-title">
              See how ATLAS works
              {" "}
              <span className="grad">in your operation.</span>
            </h2>
            <ul className="cta-list">
              <li>
                <Icon name="check" size={18} style={{ color: "#C4B5FD" }} />
                Walk through ATLAS with your own operational use case
              </li>
              <li>
                <Icon name="check" size={18} style={{ color: "#C4B5FD" }} />
                Follow a decision from signal to approved action
              </li>
              <li>
                <Icon name="check" size={18} style={{ color: "#C4B5FD" }} />
                Discuss integration, deployment and pricing
              </li>
            </ul>
            <div className="ea-card">
              <span className="ea-tag">
                <Icon name="gift" size={14} />
                Early Access
              </span>
              <h3>Participate in the early trial</h3>
              <p>
                Join ATLAS Early Access and get Founding Partner pricing. Open to the first 10 customers.
              </p>
              <div className="ea-acts">
                <button type="button" className="ea-join js-ea">
                  Join Early Access
                  <Icon name="arrow" size={16} />
                </button>
                <a href="#faq-fp" className="js-fp">View eligibility</a>
              </div>
            </div>
            <div>
              <button className="txt-link js-demo" type="button" style={{ padding: "0", height: "44px" }}>
                <span className="play">
                  <Icon name="play" size={11} />
                </span>
                Watch ATLAS in action
              </button>
            </div>
          </div>
          <form className="form" id="form" noValidate>
            <div id="form-body">
              <h3>Start the conversation</h3>
              <p className="fsub">
                Tell us a little about you. We’ll get back to you to set up your walkthrough.
              </p>
              <div className="fld">
                <label htmlFor="f-name">
                  Full name
                  {" "}
                  <span className="req" aria-hidden="true">*</span>
                </label>
                <input id="f-name" name="name" type="text" placeholder="Your name" autoComplete="name" required aria-describedby="e-name" />
                <span className="err" id="e-name" hidden>
                  <Icon name="alert" size={14} />
                  Please enter your name.
                </span>
              </div>
              <div className="fld">
                <label htmlFor="f-mail">
                  Work email
                  {" "}
                  <span className="req" aria-hidden="true">*</span>
                </label>
                <input id="f-mail" name="email" type="email" placeholder="you@company.com" autoComplete="email" required aria-describedby="e-mail" />
                <span className="err" id="e-mail" hidden>
                  <Icon name="alert" size={14} />
                  Please enter a valid work email.
                </span>
              </div>
              <div className="fld">
                <label htmlFor="f-co">
                  Company
                  {" "}
                  <span className="req" aria-hidden="true">*</span>
                </label>
                <input id="f-co" name="company" type="text" placeholder="Company name" autoComplete="organization" required aria-describedby="e-co" />
                <span className="err" id="e-co" hidden>
                  <Icon name="alert" size={14} />
                  Please enter your company.
                </span>
              </div>
              <div className="fld">
                <span className="flabel" id="f-goal-l">
                  What operations would you like to improve with ATLAS?
                  {" "}
                  <span style={{ fontWeight: "500", color: "var(--muted-l)" }}>
                    (optional, choose any)
                  </span>
                </span>
                <div className="ms" id="f-goal">
                  <button type="button" className="ms-btn" aria-expanded="false" aria-controls="f-goal-p" aria-labelledby="f-goal-l f-goal-v">
                    <span className="ms-v" id="f-goal-v">Not sure yet</span>
                    <Icon name="chev" size={14} />
                  </button>
                  <div className="ms-p" id="f-goal-p" role="group" aria-labelledby="f-goal-l" hidden>
                    <label className="ms-o">
                      <input type="checkbox" name="goal" defaultValue="Reduce downtime" />
                      <span>Reduce downtime</span>
                    </label>
                    <label className="ms-o">
                      <input type="checkbox" name="goal" defaultValue="Improve throughput" />
                      <span>Improve throughput</span>
                    </label>
                    <label className="ms-o">
                      <input type="checkbox" name="goal" defaultValue="Improve quality" />
                      <span>Improve quality</span>
                    </label>
                    <label className="ms-o">
                      <input type="checkbox" name="goal" defaultValue="Improve safety" />
                      <span>Improve safety</span>
                    </label>
                    <label className="ms-o">
                      <input type="checkbox" name="goal" defaultValue="Optimise inventory" />
                      <span>Optimise inventory</span>
                    </label>
                    <label className="ms-o">
                      <input type="checkbox" name="goal" defaultValue="Plan better" />
                      <span>Plan better</span>
                    </label>
                    <label className="ms-o">
                      <input type="checkbox" name="goal" defaultValue="Control cost" />
                      <span>Control cost</span>
                    </label>
                    <div className="ms-foot">
                      <button type="button" className="ms-clear">Clear</button>
                      <button type="button" className="ms-done">Done</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="fld">
                <span className="flabel" id="f-pkg-l">
                  Applications of interest
                  {" "}
                  <span style={{ fontWeight: "500", color: "var(--muted-l)" }}>
                    (optional, choose any)
                  </span>
                </span>
                <div className="ms" id="f-pkg">
                  <button type="button" className="ms-btn" aria-expanded="false" aria-controls="f-pkg-p" aria-labelledby="f-pkg-l f-pkg-v">
                    <span className="ms-v" id="f-pkg-v">Not sure yet</span>
                    <Icon name="chev" size={14} />
                  </button>
                  <div className="ms-p" id="f-pkg-p" role="group" aria-labelledby="f-pkg-l" hidden>
                    <div className="ms-foot">
                      <button type="button" className="ms-clear">Clear</button>
                      <button type="button" className="ms-done">Done</button>
                    </div>
                  </div>
                </div>
              </div>
              <label className="chk" htmlFor="f-ea">
                <input type="checkbox" id="f-ea" name="early_access" />
                <span>Participate in the Early Access trial</span>
              </label>
              <button className="btn btn-primary btn-block btn-lg" type="submit">
                Book an ATLAS walkthrough
                <Icon name="arrow" size={18} />
              </button>
              <span className="fine">
                Fields marked * are required. By submitting, you agree to be contacted by Altimeda about ATLAS and accept our
                {" "}
                <a className="fine-doc" href="/terms-of-service">Terms of Service</a>
                . See how we handle your details in our
                {" "}
                <a className="fine-doc" href="/privacy-policy">Privacy Policy</a>
                .
              </span>
            </div>
            <div id="form-ok" className="form-ok" hidden tabIndex={-1} aria-labelledby="ok-h">
              <span className="ok-ico">
                <Icon name="check" size={28} />
              </span>
              <span className="ok-k">Request received</span>
              <h3 id="ok-h">
                Thanks. We’ll contact you to arrange your ATLAS walkthrough.
              </h3>
              <dl className="ok-sum" id="ok-sum" />
              <div className="ok-next">
                <small>What happens next</small>
                <ol>
                  <li>
                    <b>1</b>
                    We review your operation and use case
                  </li>
                  <li>
                    <b>2</b>
                    We contact you to agree a time
                  </li>
                  <li>
                    <b>3</b>
                    Your walkthrough, built around your operations
                  </li>
                </ol>
              </div>
              <div className="ok-acts">
                <button className="btn btn-outline btn-sm js-demo" type="button">
                  <span className="play">
                    <Icon name="play" size={10} />
                  </span>
                  Watch ATLAS in action
                </button>
                <button className="linkbtn" type="button" id="ok-edit">Edit my details</button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <footer className="foot">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <a href="#top" className="brand">
                <svg className="brand-mark" width="27" height="24" viewBox="0 0 162 146" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <g clipPath="url(#clip0_foot)">
                    <path d="M2.26702 111.265C6.70029 103.525 63.7507 4.7879 63.7507 4.7879C65.4523 1.83596 68.587 0.0179996 71.9813 0C71.9903 0 72.0082 0 72.0172 0C75.4026 0 78.5283 1.79096 80.2478 4.7249L142.251 110.482H119.807L72.0888 28.6194L11.7784 133.17C11.7784 133.17 12.6203 138.156 13.0502 140.955C11.8321 139.425 5.63451 129.876 2.40136 125.061C-0.840753 120.247 -0.715368 116.476 2.26702 111.265Z" fill="url(#paint0_linear_foot)" />
                    <path d="M2.26813 111.265C-0.71425 116.476 -0.839635 120.247 2.39352 125.061C5.63563 129.876 11.8243 139.425 13.0423 140.955C12.6214 138.156 11.7706 133.17 11.7706 133.17L30.65 100.438L14.8873 89.3772C8.34038 100.726 3.45034 109.213 2.26813 111.265Z" fill="url(#paint1_linear_foot)" />
                    <path d="M139.999 145.5C147.791 145.5 147.997 142.746 150.317 139.578C152.636 136.401 157.894 127.311 157.894 127.311C157.894 127.311 39.8164 127.311 35.822 127.311C33.6546 127.311 33.1979 125.817 34.0935 124.233C35.8399 121.155 80.7996 43.5318 80.7996 43.5318L72.0853 28.6191C72.0853 28.6191 13.2795 130.587 11.6853 133.332C8.91786 138.075 12.2585 145.491 22.8536 145.491C33.4486 145.491 133.273 145.5 139.999 145.5Z" fill="url(#paint2_linear_foot)" />
                    <path d="M71.9808 0C76.5843 0 87.036 0 90.0184 0C93.0008 0 96.7445 0.557988 100.497 6.72286C104.241 12.8877 157.485 106.378 160.387 111.76C163.7 117.907 159.795 124.899 157.906 127.302C152.711 127.302 39.5597 127.302 35.834 127.302C32.1082 127.302 33.6129 125.088 34.1055 124.224C34.598 123.36 41.9689 110.617 41.9689 110.617L142.268 110.464C142.268 110.464 81.6176 6.76786 80.2652 4.7069C78.7248 2.40295 77.453 0.548989 71.9808 0Z" fill="url(#paint3_linear_foot)" />
                    <path d="M114.945 127.311L106.535 145.5C123.892 145.5 137.658 145.5 140.013 145.5C147.805 145.5 148.011 142.746 150.331 139.578C152.641 136.401 157.907 127.311 157.907 127.311C157.907 127.311 138.383 127.311 114.945 127.311Z" fill="url(#paint4_linear_foot)" />
                    <path d="M80.7923 43.5318L72.087 28.6191C72.087 28.6191 63.3369 43.7928 52.5 62.5844L62.504 75.1212C72.2661 58.2465 80.7923 43.5318 80.7923 43.5318Z" fill="url(#paint5_linear_foot)" />
                    <path d="M142.249 110.473L126.343 83.3477H103.988L119.805 110.473H142.249Z" fill="url(#paint6_linear_foot)" />
                    <path d="M41.96 110.625C41.96 110.625 34.598 123.369 34.1055 124.233C33.6129 125.097 32.1082 127.311 35.834 127.311C37.2938 127.311 55.5553 127.311 77.5426 127.311L72.8675 110.58L41.96 110.625Z" fill="url(#paint7_linear_foot)" />
                    <path d="M100.508 6.72286C96.7558 0.557988 93.0122 0 90.0298 0C87.0474 0 76.5956 0 71.9922 0C77.4644 0.548989 79.3272 3.07794 80.2587 4.7249C82.4619 8.61282 89.1789 19.5656 99.5053 37.1962H118.027C109.017 21.4286 101.798 8.85582 100.508 6.72286Z" fill="url(#paint8_linear_foot)" />
                    <path d="M133.104 94.8581L132.19 95.407L80.8984 7.64985L81.8209 7.10986L133.104 94.8581Z" fill="url(#paint9_linear_foot)" />
                    <path d="M18.899 120.994L17.9766 120.463L68.695 32.3728L69.6175 32.9038L18.899 120.994Z" fill="url(#paint10_linear_foot)" />
                    <path d="M36.9453 128.356V127.285L138.221 127.294V128.356H36.9453Z" fill="url(#paint11_linear_foot)" />
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear_foot" x1="69.7063" y1="92.0691" x2="64.1899" y2="5.56042" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#B567FF" />
                      <stop offset="1" stopColor="#AF9BFF" />
                    </linearGradient>
                    <linearGradient id="paint1_linear_foot" x1="23.235" y1="100.772" x2="5.04193" y2="128.774" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#D8C4FF" stopOpacity="0" />
                      <stop offset="1" stopColor="white" />
                    </linearGradient>
                    <linearGradient id="paint2_linear_foot" x1="90.123" y1="120.176" x2="115.148" y2="73.0764" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E1AEFF" />
                      <stop offset="1" stopColor="#E2BCFF" />
                    </linearGradient>
                    <linearGradient id="paint3_linear_foot" x1="107.013" y1="66.4643" x2="36.6846" y2="91.1654" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F5D1FF" />
                      <stop offset="1" stopColor="#DB6EFF" />
                    </linearGradient>
                    <linearGradient id="paint4_linear_foot" x1="113.235" y1="137.54" x2="166.115" y2="133.508" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#CEABFF" stopOpacity="0" />
                      <stop offset="1" stopColor="white" />
                    </linearGradient>
                    <linearGradient id="paint5_linear_foot" x1="61.3553" y1="59.6349" x2="84.3888" y2="29.8166" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#C98FFF" stopOpacity="0" />
                      <stop offset="1" stopColor="white" />
                    </linearGradient>
                    <linearGradient id="paint6_linear_foot" x1="130.466" y1="113.721" x2="119.05" y2="87.858" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#BA82E5" />
                      <stop offset="1" stopColor="#8B3BFB" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="paint7_linear_foot" x1="33.3797" y1="118.943" x2="77.536" y2="118.943" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#BB7CFF" />
                      <stop offset="1" stopColor="#E6A2FF" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="paint8_linear_foot" x1="103.883" y1="38.0501" x2="86.1508" y2="-0.430834" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#CE79FF" stopOpacity="0" />
                      <stop offset="1" stopColor="#B580FF" />
                    </linearGradient>
                    <linearGradient id="paint9_linear_foot" x1="80.9" y1="51.2564" x2="133.108" y2="51.2564" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" stopOpacity="0" />
                      <stop offset="0.4822" stopColor="white" />
                      <stop offset="1" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="paint10_linear_foot" x1="30.9333" y1="53.861" x2="56.8492" y2="99.4017" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" stopOpacity="0" />
                      <stop offset="0.4822" stopColor="white" />
                      <stop offset="1" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="paint11_linear_foot" x1="100.808" y1="105.205" x2="74.1709" y2="150.328" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" stopOpacity="0" />
                      <stop offset="0.4822" stopColor="white" />
                      <stop offset="1" stopColor="#D34DFF" stopOpacity="0" />
                    </linearGradient>
                    <clipPath id="clip0_foot">
                      <rect width="161.667" height="144.793" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span className="brand-word">ATLAS</span>
                <span className="brand-by">by Altimeda</span>
              </a>
              <p>
                The AI Operating Engine for industrial data, context, applications and automation.
              </p>
              <span className="foot-tag">BEYOND DATA</span>
            </div>
            <div className="foot-cols">
              <div className="foot-col">
                <b>Platform</b>
                <a href="#integrations">FABRIX</a>
                <a href="#ontrix">ONTRIX</a>
                <a href="#nexa">NEXA</a>
              </div>
              <div className="foot-col">
                <b>Solutions</b>
                <a href="#industries" className="js-open-ind">Manufacturing</a>
                <a href="#industries" className="js-open-ind">Mining</a>
                <a href="#industries" className="js-open-ind">Construction</a>
                <a href="#industries" className="js-open-ind">Enterprise</a>
              </div>
              <div className="foot-col">
                <b>Resources</b>
                <a href="#">Architecture</a>
                <a href="#">Security</a>
                <a href="#">Documentation</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="foot-col">
                <b>Company</b>
                <a href="#">About Altimeda</a>
                <a href="#walkthrough">Contact</a>
              </div>
            </div>
          </div>
          <div className="foot-bot">
            <span>© 2026 Altimeda. All rights reserved.</span>
            <div className="foot-legal">
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/terms-of-service">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </RevealSection>
  );
}
