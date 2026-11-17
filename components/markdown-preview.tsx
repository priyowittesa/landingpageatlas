"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownPreviewProps = {
  content: string;
  className?: string;
  onWikiLinkClick?: (reference: string) => void;
  unwrapWikiLinks?: boolean;
  compact?: boolean;
};

function MarkdownLink({
  href,
  children,
  onWikiLinkClick,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  onWikiLinkClick?: (reference: string) => void;
}) {
  const external = Boolean(href && /^(https?:)?\/\//i.test(href));
  const wikiReference = href?.startsWith("#wiki:")
    ? decodeURIComponent(href.slice("#wiki:".length))
    : undefined;

  return (
    <a
      {...props}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      onClick={(event) => {
        if (!wikiReference) return;
        event.preventDefault();
        onWikiLinkClick?.(wikiReference);
      }}
      className="font-medium text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800"
    >
      {children}
    </a>
  );
}

export function MarkdownPreview({
  content,
  className,
  onWikiLinkClick,
  unwrapWikiLinks = false,
  compact = false
}: MarkdownPreviewProps) {
  const renderedContent = unwrapWikiLinks
    ? content.replace(/\[\[([\s\S]*?)\]\]/g, (_, reference: string) => {
        const [target, label = target] = reference.split("|");
        return `[${label.trim()}](#wiki:${encodeURIComponent(target.trim())})`;
      })
    : content;

  return (
    <article
      className={cn(
        "min-w-0 break-words text-gray-700",
        compact ? "text-[11px] leading-relaxed" : "text-[15px] leading-7",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className={cn(
                "font-bold tracking-tight text-gray-950",
                compact
                  ? "mb-2 mt-0 border-b border-gray-200 pb-1 text-xs"
                  : "mb-5 mt-0 border-b border-gray-200 pb-3 text-3xl"
              )}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={cn(
                "font-semibold tracking-tight text-gray-900",
                compact
                  ? "mb-1.5 mt-2.5 border-b border-gray-100 pb-0.5 text-[11.5px]"
                  : "mb-3 mt-8 border-b border-gray-100 pb-2 text-2xl"
              )}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={cn(
                "font-semibold text-gray-900",
                compact ? "mb-1 mt-2 text-[11px]" : "mb-2 mt-6 text-xl"
              )}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className={cn(
                "font-semibold text-gray-900",
                compact ? "mb-1 mt-1.5 text-[11px]" : "mb-2 mt-5 text-lg"
              )}
            >
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5
              className={cn(
                "font-semibold text-gray-900",
                compact ? "mb-1 mt-1 text-[10.5px]" : "mb-2 mt-4 text-base"
              )}
            >
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6
              className={cn(
                "font-semibold uppercase tracking-wide text-gray-600",
                compact ? "mb-1 mt-1 text-[10px]" : "mb-2 mt-4 text-sm"
              )}
            >
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p
              className={cn(
                compact ? "mb-2 last:mb-0 text-[14px]" : "mb-4 last:mb-0"
              )}
            >
              {children}
            </p>
          ),
          a: ({ href, children, ...props }) => (
            <MarkdownLink
              {...props}
              href={href}
              onWikiLinkClick={onWikiLinkClick}
            >
              {children}
            </MarkdownLink>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-950">{children}</strong>
          ),
          ul: ({ children, className: listClassName }) => (
            <ul
              className={cn(
                "list-disc",
                compact ? "mb-2 ml-4 space-y-1" : "mb-4 ml-6 space-y-1.5",
                listClassName
              )}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={cn(
                "list-decimal",
                compact ? "mb-2 ml-4 space-y-1" : "mb-4 ml-6 space-y-1.5"
              )}
            >
              {children}
            </ol>
          ),
          li: ({ children, className: itemClassName }) => (
            <li className={cn("pl-1 marker:text-gray-400", itemClassName)}>
              {children}
            </li>
          ),
          input: (props) => (
            <input
              {...props}
              className={cn(
                "mr-2 accent-primary-600",
                compact ? "size-3.5 translate-y-0.5" : "size-4 translate-y-0.5"
              )}
            />
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "border-primary-400 bg-primary-50/60 italic text-gray-700",
                compact
                  ? "my-2 border-l-2 py-1 pl-3 pr-2 text-[10.5px]"
                  : "my-5 border-l-4 py-2 pl-4 pr-3 text-sm"
              )}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr
              className={cn(
                "border-0 border-t border-gray-200",
                compact ? "my-3" : "my-8"
              )}
            />
          ),
          table: ({ children }) => (
            <div
              className={cn(
                "max-w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm",
                compact ? "my-2" : "my-5"
              )}
            >
              <table
                className={cn(
                  "w-max min-w-full border-collapse text-left",
                  compact ? "text-[10px]" : "text-sm"
                )}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-100 text-gray-800">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-gray-50/70">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              className={cn(
                "border-r border-gray-200 font-semibold last:border-r-0",
                compact ? "px-2 py-1" : "px-4 py-2.5"
              )}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className={cn(
                "border-r border-gray-200 align-top last:border-r-0",
                compact ? "px-2 py-1" : "px-4 py-2.5"
              )}
            >
              {children}
            </td>
          ),
          pre: ({ children }) => (
            <pre
              className={cn(
                "max-w-full overflow-x-auto rounded-lg bg-gray-950 text-gray-100 shadow-sm",
                compact
                  ? "my-2 p-2.5 text-[10px] leading-4"
                  : "my-5 p-4 text-sm leading-6"
              )}
            >
              {children}
            </pre>
          ),
          code: ({ children, className: codeClassName, ...props }) => {
            const fenced = Boolean(codeClassName?.startsWith("language-"));
            return (
              <code
                {...props}
                className={cn(
                  "font-mono",
                  fenced
                    ? codeClassName
                    : compact
                      ? "rounded bg-gray-100 px-1 py-0.5 text-[10px] text-primary-800"
                      : "rounded bg-gray-100 px-1.5 py-0.5 text-[0.9em] text-primary-800"
                )}
              >
                {children}
              </code>
            );
          },
          // Markdown images have arbitrary remote sources and no known dimensions.
          img: ({ alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              alt={alt ?? ""}
              loading="lazy"
              className={cn(
                "h-auto max-w-full rounded-lg border border-gray-200",
                compact ? "my-2" : "my-5"
              )}
            />
          ),
          del: ({ children }) => (
            <del className="text-gray-500 decoration-gray-400">{children}</del>
          )
        }}
      >
        {renderedContent}
      </ReactMarkdown>
    </article>
  );
}
