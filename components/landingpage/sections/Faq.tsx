import { FAQ_CATEGORIES, FAQ_ITEMS } from "../data/faq";
import { Icon } from "../ui/Icon";
import { RevealSection } from "./RevealSection";

export function Faq() {
  return (
    <RevealSection className="sec light" id="faq" aria-labelledby="faq-title">
      <div className="wrap faq-in">
        <div className="faq-side">
          <span className="eyebrow">
            <span className="dot" />
            FAQ
          </span>
          <h2 className="h2" id="faq-title">Questions, answered.</h2>
          <p className="lead">
            Can’t find what you need? Our team will walk you through ATLAS with your own use case.
          </p>
          <p>
            <a className="tlink big" href="#walkthrough">
              Talk to our team
              <Icon name="arrow" size={16} />
            </a>
          </p>
        </div>
        <div>
          <div className="fcats" role="group" aria-label="Filter questions by topic">
            {FAQ_CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={category.id === "all" ? "fchip on" : "fchip"}
                type="button"
                data-c={category.id}
                aria-pressed={category.id === "all" ? "true" : "false"}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="faq-list" id="faq-list">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="acc"
                id={item.id}
                data-c={item.category}
                data-top={item.featured ? "1" : undefined}
              >
                <summary>
                  {item.question}
                  <span className="pm">
                    <Icon name="plus" size={16} />
                  </span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" type="button" id="faq-all" style={{ marginTop: "20px" }}>
            View all questions
          </button>
        </div>
      </div>
    </RevealSection>
  );
}
