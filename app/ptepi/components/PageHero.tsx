import Link from "next/link";
import { ArrowDown, CalendarClock } from "lucide-react";
import { epiData } from "../data";
import { getAsAtLabel } from "../selectors";
import type { ReactNode } from "react";

type HeroStat = {
  label: string;
  value: ReactNode;
};

type PageHeroProps = {
  /** The page title; the page's only h1 */
  title: string;
  /** The one sentence the screen opens with, computed in selectors */
  headline: string;
  detail: string;
  stats: HeroStat[];
  /** Anchor of the section the call to action scrolls to */
  actionHref: string;
  actionLabel: string;
};

/**
 * The opening card of the portfolio screen: a dark violet focal point with the
 * answer to "what needs attention" and the headline figures on frosted tiles.
 */
export function PageHero({ title, headline, detail, stats, actionHref, actionLabel }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-900 to-primary-700 p-6 text-white shadow-lg sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-base font-medium text-primary-100">{title}</h1>
          <p className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{headline}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100">{detail}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
          <CalendarClock size={16} aria-hidden />
          As at {getAsAtLabel(epiData)}
        </span>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <dt className="text-xs text-primary-100">{stat.label}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <Link
        href={actionHref}
        className="relative mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-900 shadow-sm transition-colors hover:bg-primary-50"
      >
        {actionLabel}
        <ArrowDown size={16} aria-hidden />
      </Link>
    </section>
  );
}
