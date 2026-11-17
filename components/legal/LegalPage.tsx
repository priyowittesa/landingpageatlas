"use client";

import { useEffect } from "react";
import type { HTMLAttributes } from "react";
import type { LegalDocument } from "./legal-content";

type LegalPageProps = {
  document: LegalDocument;
  content: string;
};

type LegalPageParts = {
  lead: string;
  header: string;
  mainClass: string;
  mainBeforeSections: string;
  sections: string[];
  mainAfterSections: string;
  footer: string;
} | null;

function splitLegalPage(content: string): LegalPageParts {
  const headerMatch = /<header\b[^>]*>[\s\S]*?<\/header>/i.exec(content);
  const mainOpen = /<main\b([^>]*)>/i.exec(content);
  if (!headerMatch || !mainOpen) return null;

  const mainStart = mainOpen.index + mainOpen[0].length;
  const closePattern = /<\/main\s*>/gi;
  closePattern.lastIndex = mainStart;
  const mainClose = closePattern.exec(content);
  if (!mainClose) return null;

  const mainContent = content.slice(mainStart, mainClose.index);
  const matches = [...mainContent.matchAll(/<section\b[\s\S]*?<\/section>/gi)];
  if (!matches.length) return null;

  const first = matches[0];
  const last = matches[matches.length - 1];
  const className = /\bclass\s*=\s*(["'])(.*?)\1/i.exec(mainOpen[1])?.[2] ?? "";

  return {
    lead: content.slice(0, headerMatch.index),
    header: headerMatch[0],
    mainClass: className,
    mainBeforeSections: mainContent.slice(0, first.index),
    sections: matches.map((match) => match[0]),
    mainAfterSections: mainContent.slice(last.index! + last[0].length),
    footer: content.slice(mainClose.index + mainClose[0].length)
  };
}

function parseSection(markup: string) {
  const match = markup.match(/^\s*<section\b([^>]*)>([\s\S]*)<\/section>\s*$/i);
  if (!match) return null;

  const props: HTMLAttributes<HTMLElement> = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let attribute: RegExpExecArray | null;
  while ((attribute = pattern.exec(match[1]))) {
    const [, name, doubleValue, singleValue, unquotedValue] = attribute;
    const value = doubleValue ?? singleValue ?? unquotedValue ?? "";
    if (name === "class") props.className = value;
    else if (name === "id") props.id = value;
    else if (name === "aria-labelledby") props["aria-labelledby"] = value;
  }

  return { props, children: match[2] };
}

function LegalSection({ markup }: { markup: string }) {
  const section = parseSection(markup);
  if (!section) return null;

  return (
    <section
      {...section.props}
      dangerouslySetInnerHTML={{ __html: section.children }}
    />
  );
}

function LegalHeader({ markup }: { markup: string }) {
  const match = markup.match(/^\s*<header\b([^>]*)>([\s\S]*)<\/header>\s*$/i);
  if (!match) return null;
  const className = /\bclass\s*=\s*(["'])(.*?)\1/i.exec(match[1])?.[2];

  return (
    <header
      className={className}
      dangerouslySetInnerHTML={{ __html: match[2] }}
    />
  );
}

function LegalFooter({ markup }: { markup: string }) {
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}

export function LegalPage({ document, content }: LegalPageProps) {
  const parts = splitLegalPage(content);

  useEffect(() => {
    const fonts = window.document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap";
    fonts.dataset.legalPage = document;
    window.document.head.appendChild(fonts);

    const root = window.document.querySelector<HTMLElement>(
      `[data-legal-document="${document}"]`
    );
    if (!root) {
      return () => {
        fonts.remove();
      };
    }

    const details = [...root.querySelectorAll<HTMLDetailsElement>(".pp-sec")];
    const tocLinks = [...root.querySelectorAll<HTMLAnchorElement>(".pp-toc a")];
    const expandButton = root.querySelector<HTMLButtonElement>(".js-exp");
    const collapseButton = root.querySelector<HTMLButtonElement>(".js-col");

    const expandAll = () => details.forEach((item) => (item.open = true));
    const collapseAll = () => details.forEach((item) => (item.open = false));
    expandButton?.addEventListener("click", expandAll);
    collapseButton?.addEventListener("click", collapseAll);

    const handleHashLink = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor || !root.contains(anchor)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.length < 2) return;
      const destination = root.querySelector<HTMLElement>(href);
      if (!destination) return;

      event.preventDefault();
      if (destination instanceof HTMLDetailsElement) destination.open = true;
      destination.scrollIntoView({ behavior: "smooth" });
      if (href === "#main") {
        destination.tabIndex = -1;
        destination.focus({ preventScroll: true });
      }
      window.history.pushState(null, "", href);
    };
    root.addEventListener("click", handleHashLink, true);

    const currentHash = window.location.hash;
    if (currentHash) {
      const initialTarget = root.querySelector<HTMLDetailsElement>(currentHash);
      if (initialTarget instanceof HTMLDetailsElement)
        initialTarget.open = true;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          tocLinks.forEach((link) => {
            const current = link.hash === `#${entry.target.id}`;
            link.classList.toggle("on", current);
            if (current) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    details.forEach((item) => observer.observe(item));

    return () => {
      expandButton?.removeEventListener("click", expandAll);
      collapseButton?.removeEventListener("click", collapseAll);
      root.removeEventListener("click", handleHashLink, true);
      observer.disconnect();
      fonts.remove();
    };
  }, [document]);

  if (!parts) {
    return (
      <div
        data-legal-document={document}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="atlas-legal-page" data-legal-document={document}>
      <div dangerouslySetInnerHTML={{ __html: parts.lead }} />
      <LegalHeader markup={parts.header} />
      <main id="main" className={parts.mainClass}>
        <div dangerouslySetInnerHTML={{ __html: parts.mainBeforeSections }} />
        {parts.sections.map((markup, index) => (
          <LegalSection key={index} markup={markup} />
        ))}
        <div dangerouslySetInnerHTML={{ __html: parts.mainAfterSections }} />
      </main>
      <LegalFooter markup={parts.footer} />
    </div>
  );
}
