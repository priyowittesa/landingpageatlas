import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Trust() {
  return (
    <RevealSection className="sec dark" id="trust" aria-labelledby="trust-title">
      <div className="hero-bg" style={{ background: "radial-gradient(700px 420px at 85% 10%,rgba(124,58,237,.25),transparent 70%)" }} />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="sec-head">
          <span className="eyebrow">
            <span className="dot" />
            Trust, security &amp; deployment
          </span>
          <h2 className="h2" id="trust-title">
            AI your operations team
            {" "}
            <span className="grad">can trust.</span>
          </h2>
          <p className="lead">
            Every ATLAS decision can be explained, reviewed and audited, on a platform built to enterprise security standards.
          </p>
        </div>
        <div className="tpromise">
          <span className="tp-ico">
            <Icon name="key" size={28} />
          </span>
          <div className="tp-copy">
            <span className="tp-k">Our commitment</span>
            <h3>Your data stays yours.</h3>
            <p>
              Your operational data, the operational model built in ONTRIX and the outputs ATLAS generates belong to your organisation, and are never used to train public AI models.
            </p>
          </div>
          <ul className="tp-pts">
            <li>
              <Icon name="check" size={16} />
              You own your data
            </li>
            <li>
              <Icon name="check" size={16} />
              You own your operational model
            </li>
            <li>
              <Icon name="check" size={16} />
              Never used to train public AI
            </li>
          </ul>
        </div>
        <div className="tacc-list">
          <details className="acc tacc">
            <summary>
              <span className="tsum">
                <span className="ti">
                  <Icon name="spark" size={20} />
                </span>
                <span>
                  <b>AI Trust</b>
                  <small>Provenance, explainability, approvals and model governance</small>
                </span>
              </span>
              <span className="pm">
                <Icon name="plus" size={16} />
              </span>
            </summary>
            <div className="acc-in tcol ai">
              <ul className="tlist">
                <li>
                  <Icon name="branch" size={16} />
                  <div>
                    <b>Decision provenance</b>
                    <span>
                      See which facts, rules and models drove every recommendation.
                    </span>
                  </div>
                </li>
                <li>
                  <Icon name="eye" size={16} />
                  <div>
                    <b>Explainable predictions</b>
                    <span>The drivers behind each prediction, shown in plain terms.</span>
                  </div>
                </li>
                <li>
                  <Icon name="users" size={16} />
                  <div>
                    <b>Human approval &amp; overrides</b>
                    <span>
                      People approve actions, and every human override is recorded.
                    </span>
                  </div>
                </li>
                <li>
                  <Icon name="layers" size={16} />
                  <div>
                    <b>Model governance</b>
                    <span>
                      Version control and approval workflows before any model reaches production.
                    </span>
                  </div>
                </li>
                <li>
                  <Icon name="trend" size={16} />
                  <div>
                    <b>Performance drift monitoring</b>
                    <span>
                      Models are watched in production and flagged when accuracy changes.
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </details>
          <details className="acc tacc">
            <summary>
              <span className="tsum">
                <span className="ti">
                  <Icon name="shield" size={20} />
                </span>
                <span>
                  <b>Platform Security</b>
                  <small>Access, encryption, isolation, logs and resilience</small>
                </span>
              </span>
              <span className="pm">
                <Icon name="plus" size={16} />
              </span>
            </summary>
            <div className="acc-in tcol tsec">
              <dl className="av-key" aria-label="Availability key">
                <div>
                  <dt>
                    <em className="av a-std">Standard</em>
                  </dt>
                  <dd>In every package</dd>
                </div>
                <div>
                  <dt>
                    <em className="av a-avl">Available</em>
                  </dt>
                  <dd>On request or as an add-on</dd>
                </div>
                <div>
                  <dt>
                    <em className="av a-ent">Enterprise</em>
                  </dt>
                  <dd>On Enterprise plans</dd>
                </div>
                <div>
                  <dt>
                    <em className="av a-dep">Deployment-dependent</em>
                  </dt>
                  <dd>Depends on cloud, private cloud or on-premise</dd>
                </div>
              </dl>
              <ul className="tlist two">
                <li>
                  <Icon name="key" size={16} />
                  <div>
                    <b>SSO / identity</b>
                    <span>SAML single sign-on with your identity provider</span>
                    <p className="avs">
                      <em className="av a-ent">Enterprise</em>
                      <em className="av a-dep">Deployment-dependent</em>
                    </p>
                  </div>
                </li>
                <li>
                  <Icon name="users" size={16} />
                  <div>
                    <b>Role-based access</b>
                    <span>Access controlled by role across business objects</span>
                    <p className="avs">
                      <em className="av a-std">Standard</em>
                    </p>
                  </div>
                </li>
                <li>
                  <Icon name="lock" size={16} />
                  <div>
                    <b>Encryption</b>
                    <span>TLS 1.2+ in transit, AES-256 at rest</span>
                    <p className="avs">
                      <em className="av a-std">Standard</em>
                    </p>
                  </div>
                </li>
                <li>
                  <Icon name="box" size={16} />
                  <div>
                    <b>Tenant isolation</b>
                    <span>Each customer in a logically isolated tenant</span>
                    <p className="avs">
                      <em className="av a-dep">Deployment-dependent</em>
                    </p>
                  </div>
                </li>
                <li>
                  <Icon name="audit" size={16} />
                  <div>
                    <b>Audit logs</b>
                    <span>Changes, access and decisions recorded</span>
                    <p className="avs">
                      <em className="av a-avl">Available</em>
                      <em className="av a-ent">Enterprise</em>
                    </p>
                  </div>
                </li>
                <li>
                  <Icon name="db" size={16} />
                  <div>
                    <b>Backup &amp; recovery</b>
                    <span>Daily backups, 24-hour RPO, 4-hour RTO</span>
                    <p className="avs">
                      <em className="av a-dep">Deployment-dependent</em>
                    </p>
                  </div>
                </li>
                <li>
                  <Icon name="globe" size={16} />
                  <div>
                    <b>Data residency</b>
                    <span>Choose where your data is hosted</span>
                    <p className="avs">
                      <em className="av a-avl">Available</em>
                      <em className="av a-ent">Enterprise</em>
                    </p>
                  </div>
                </li>
                <li>
                  <Icon name="route" size={16} />
                  <div>
                    <b>Data lineage</b>
                    <span>Where every record came from and how it changed</span>
                    <p className="avs">
                      <em className="av a-std">Standard</em>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </details>
          <details className="acc tacc">
            <summary>
              <span className="tsum">
                <span className="ti">
                  <Icon name="download" size={20} />
                </span>
                <span>
                  <b>No platform lock-in</b>
                  <small>
                    If you move on, here is how your data and operational model go with you.
                  </small>
                </span>
              </span>
              <span className="pm">
                <Icon name="plus" size={16} />
              </span>
            </summary>
            <div className="acc-in ">
              <div className="li-routes">
                <div className="li-r">
                  <Icon name="code" size={18} />
                  <b>Export through the API</b>
                  <span>
                    Pull records, events and model objects into your own systems at any time.
                  </span>
                </div>
                <div className="li-r">
                  <Icon name="download" size={18} />
                  <b>Bulk export in open formats</b>
                  <span>
                    Download data, operational model and reports as CSV, JSON or RDF.
                  </span>
                </div>
                <div className="li-r">
                  <Icon name="cloud" size={18} />
                  <b>Hand over to your nominated cloud</b>
                  <span>
                    We transfer your data to a cloud or provider you nominate, as part of a structured exit.
                  </span>
                </div>
              </div>
            </div>
          </details>
        </div>
        <div className="sub-block" style={{ marginTop: "72px" }}>
          <div className="sub-block-h">
            <div className="sub-block-t">
              <span className="eyebrow">
                <span className="dot" />
                Deployment
              </span>
              <h3>
                Your operations.
                {" "}
                <span className="grad">Your deployment choice.</span>
              </h3>
            </div>
            <p>Run ATLAS where your data needs to live.</p>
          </div>
          <div className="dep3" style={{ marginTop: "0" }}>
            <div className="depc">
              <span className="di">
                <Icon name="cloud" size={24} />
              </span>
              <h4>Cloud</h4>
              <p>The fastest way to start. Included as standard in every package.</p>
            </div>
            <div className="depc">
              <span className="di">
                <Icon name="lock" size={24} />
              </span>
              <h4>Private cloud</h4>
              <p>
                ATLAS in your own cloud tenancy, for tighter control over data and access.
              </p>
            </div>
            <div className="depc">
              <span className="di">
                <Icon name="server" size={24} />
              </span>
              <h4>On-premise</h4>
              <p>
                ATLAS inside your own data centre, for strict data-residency or network requirements.
              </p>
            </div>
          </div>
          <details className="acc">
            <summary>
              <span>
                Deployment and compliance notes
                <small>What stays the same in every deployment, and what may vary</small>
              </span>
              <span className="pm">
                <Icon name="plus" size={16} />
              </span>
            </summary>
            <div className="acc-in acc-notes">
              <p className="parity">
                <Icon name="check" size={16} style={{ color: "#6EE7B7" }} />
                <span>
                  Every deployment mode runs the same ATLAS release, with the same NEXA models, connectors and support. Updates arrive continuously in the cloud and quarterly for private cloud and on-premise. Private cloud and on-premise are available as an add-on.
                </span>
              </p>
              <p className="parity dep-note">
                <Icon name="info" size={16} style={{ color: "#C4B5FD" }} />
                <span>
                  Availability of some functionality may vary by deployment model. We confirm what applies to your setup in your quote.
                </span>
              </p>
            </div>
            <div className="comp-note">
              <Icon name="audit" size={22} style={{ color: "#C4B5FD", flex: "none" }} />
              <p>
                <b>Built to support your compliance programme.</b>
                {" "}
                Governance capabilities designed to support organisational compliance programmes, including AI transparency, auditability, data lineage and human oversight. Specific compliance documentation is provided separately.
              </p>
            </div>
          </details>
        </div>
      </div>
    </RevealSection>
  );
}
