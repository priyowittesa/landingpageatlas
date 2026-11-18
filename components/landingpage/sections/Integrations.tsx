import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Integrations() {
  return (
    <RevealSection className="sec dark sec-alt" id="integrations" aria-labelledby="int-title">
      <div className="hero-bg" style={{ background: "radial-gradient(800px 420px at 50% 0%,rgba(124,58,237,.25),transparent 70%)" }} />
      <div className="wrap" style={{ position: "relative" }}>
        <div className="sub-block-h" style={{ marginBottom: "28px" }}>
          <div className="sec-head">
            <span className="eyebrow eyebrow-n">
              <b>01</b>
              Connect · FABRIX
            </span>
            <h2 className="h2" id="int-title">
              Connect ATLAS.
              {" "}
              <span className="grad">Keep your existing systems.</span>
            </h2>
          </div>
          <p>
            ERP, MES, SCADA, IoT, databases, APIs and cloud platforms connect through FABRIX, so your existing systems stay in place.
          </p>
        </div>
        <div className="integ-grid d">
          <div className="integ-c">
            <span className="ico">
              <Icon name="server" size={22} />
            </span>
            <div>
              <h3>ERP systems</h3>
              <p>SAP, Oracle, Microsoft Dynamics, NetSuite, Epicor</p>
            </div>
          </div>
          <div className="integ-c">
            <span className="ico">
              <Icon name="layers" size={22} />
            </span>
            <div>
              <h3>MES</h3>
              <p>
                Production and execution systems, with two-way integration on Enterprise
              </p>
            </div>
          </div>
          <div className="integ-c">
            <span className="ico">
              <Icon name="cpu" size={22} />
            </span>
            <div>
              <h3>SCADA, IoT &amp; sensors</h3>
              <p>Equipment, PLCs and telematics using MQTT, CoAP or WebSocket</p>
            </div>
          </div>
          <div className="integ-c">
            <span className="ico">
              <Icon name="db" size={22} />
            </span>
            <div>
              <h3>Databases</h3>
              <p>SQL Server, PostgreSQL, MongoDB, Cassandra, Oracle</p>
            </div>
          </div>
          <div className="integ-c">
            <span className="ico">
              <Icon name="cloud" size={22} />
            </span>
            <div>
              <h3>Cloud &amp; data platforms</h3>
              <p>AWS S3, Azure Data Lake, Google Cloud Storage, Snowflake, Delta Lake</p>
            </div>
          </div>
          <div className="integ-c">
            <span className="ico">
              <Icon name="code" size={22} />
            </span>
            <div>
              <h3>APIs &amp; web services</h3>
              <p>REST, GraphQL and SOAP services</p>
            </div>
          </div>
        </div>
        <div className="imethods" aria-labelledby="im-h">
          <div className="im-h">
            <b id="im-h">Integration methods</b>
            <span>
              Which methods are available depends on each source system. We confirm them for your systems during activation.
            </span>
          </div>
          <ul className="im-list">
            <li>
              <b>API</b>
              <span>Request and push data from modern applications</span>
            </li>
            <li>
              <b>CDC</b>
              <span>Capture changes from databases as they happen</span>
            </li>
            <li>
              <b>Batch</b>
              <span>Scheduled loads from files, tables and exports</span>
            </li>
            <li>
              <b>Streaming</b>
              <span>Real-time events from equipment and IoT</span>
            </li>
          </ul>
        </div>
      </div>
    </RevealSection>
  );
}
