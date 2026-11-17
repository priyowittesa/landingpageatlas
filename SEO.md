# Technical SEO

## Confirmed context

- Public production origin: `https://atlas.altimeda.com` (confirmed by the owner).
- Stack: Next.js App Router in this frontend repository.
- Markets: Indonesia and international clients.
- Priority industries: manufacturing and construction, as supplied in the brief.
- The environment template now contains the confirmed origin. It does not
  configure an existing local environment or the production build automatically.
  Indexing remains explicitly opt-in; no deployment or Cloudflare setting changed.

## Audit before implementation

- This is Next.js 16 App Router, not a standalone marketing-only repository.
- The public pages are `/`, `/privacy-policy`, and `/terms-of-service`.
- Landing and legal text was in server-rendered HTML, but `visibility: hidden`,
  `aria-hidden`, and a loading overlay made it inaccessible without JavaScript.
  The landing page also waited for external fonts before revealing its content.
- Only a shared title/description and legal-page titles existed. There were no
  robots, sitemap, canonical, social metadata, or structured-data implementations.
- `/app` is protected by `requireAuth`; some nested layouts additionally check
  company access. Legacy application paths redirect into `/app`.
- Authentication, authorization, OAuth handlers, API behavior, and Cloudflare
  security configuration must not be relaxed to accommodate crawlers.
- No Cloudflare zone/WAF/bot policy is managed in this repository. The production
  deployment builds a standalone Docker image using a secret-provided `.env`.
- The existing landing copy includes `DUMMY COPY` markers around commercial,
  deployment, data-security, and other claims. Those claims were not promoted
  into JSON-LD. Existing marketing and legal copy still needs owner review.
- `package.json` does declare Vitest, unlike the older project guidance, but the
  locally installed dependency tree lacks Vitest and several graph packages.

## Implemented behavior

- Public pages have distinct titles, descriptions, Open Graph, Twitter metadata,
  and absolute self-canonical URLs when a valid `SITE_URL` is configured.
- The root defaults to noindex/nofollow. Only the reviewed public pages opt into
  indexing, and only after production indexing is explicitly enabled.
- `/app`, `/auth`, `/api`, onboarding, and error/access-denied pages receive
  `X-Robots-Tag: noindex, nofollow, noarchive`. Header rules also cover legacy
  application paths, although Next.js may serve redirects before applying these
  headers. Legacy redirect targets remain in the protected `/app` namespace.
  This is an indexing instruction, not an access-control mechanism.
- Public content is readable in the initial HTML without JavaScript. Legal CSS
  is included by Next.js instead of being fetched only after hydration. Existing
  client interactions remain progressive enhancements.
- A visible bilingual overview uses only the supplied enterprise AI,
  manufacturing/construction, and Indonesia/international-market context.
  The document remains English, with Indonesian text marked `lang="id"`.
  No hreflang or translated-page URLs are invented.
- Homepage JSON-LD contains Altimeda `Organization`, ATLAS `SoftwareApplication`,
  and a bilingual `FAQPage` matching the visible overview exactly. It has no
  invented prices, ratings, addresses, customer results, social profiles, or
  production URLs. No `Article` schema is added without a public article.
- `/robots.txt` applies one wildcard policy to ordinary search and AI crawlers,
  including OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, ClaudeBot,
  Claude-SearchBot, Googlebot, and Bingbot. On the enabled public deployment it
  permits public resources and excludes private route prefixes. No bot-specific
  authentication or WAF bypass is introduced.
- `/sitemap.xml` is generated from the reviewed public-page registry in
  `lib/seo.ts`, never from all application routes. It contains no fabricated
  `lastModified` timestamps. Update this registry when publishing a public page.
- `/llms.txt` contains the confirmed bilingual description and public references.
  It is an experimental discovery aid, not a promise of AI citations.
- Optional Google/Bing ownership tokens and an opt-in IndexNow notification
  command are supported. IndexNow uses exactly the sitemap's public URLs.

## Required deployment configuration

Use Node.js 24, matching the Dockerfile. `.env.example` documents these settings:

- `SITE_URL=https://atlas.altimeda.com`: the owner-confirmed public HTTPS origin,
  without a path, query, fragment, credentials, custom port, or application/auth path.
  Never substitute `NEXTAUTH_URL`, the API origin, the request Host header, or
  an unconfirmed domain.
- `SEO_INDEXABLE=true`: explicitly enable only for the approved public production
  deployment. Leave false/unset on development, staging, and preview deployments.
  Development and Vercel preview environments are additionally fail-closed.
- `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`: optional actual tokens
  from the corresponding owner accounts.
- `INDEXNOW_KEY`: optional 8-128 character ownership key containing only ASCII
  letters, digits, and hyphens. This is intentionally public, not an API secret.

These values are build-time configuration for static pages and metadata routes.
Include them in the production build environment/secret-provided `.env`, then
rebuild and redeploy after changing them. Setting only a runtime container
variable does not update already generated pages.

Until the build environment supplies the public origin and explicit enablement, public pages
remain noindex, robots disallows crawling, sitemap has no URL entries, and
`/llms.txt` and `/indexnow-key.txt` return 404. Canonicals and domain-derived
schema URLs are omitted when no valid origin is configured.

## Verification commands

- `pnpm exec tsc --noEmit --incremental false`
- `pnpm lint`
- `pnpm test` (package-manager checks, Vitest, then SEO checks; requires locked dependencies)
- `pnpm test:seo` (Node-native regression checks, no additional dependency)
- `pnpm build`

With a local dev or production server already running, set `SEO_TEST_ORIGIN` to
its loopback HTTP origin and run `pnpm test:seo` for additional HTTP checks.
These checks assert server-readable public HTML, route metadata, JSON-LD,
authentication redirects, legacy redirects, and private noindex headers.
They reject non-loopback targets to avoid accidentally crawling production.
For a local production build with indexing enabled, also set
`SEO_TEST_INDEXABLE=true`; otherwise the HTTP checks expect fail-closed behavior.

## IndexNow and release checks

1. Configure the confirmed production origin above and approve the existing
   public copy before enabling indexing. Publish the build with the required variables.
2. Verify `/robots.txt`, `/sitemap.xml`, `/llms.txt`, rendered canonicals, JSON-LD,
   and private noindex headers on the deployed origin, including via Cloudflare.
3. Verify `/indexnow-key.txt` returns the configured ownership key publicly.
4. Run `pnpm seo:indexnow` locally with the matching production configuration.
   This is a dry run and performs no network request.
5. Only with explicit approval to notify the external service, run
   `pnpm seo:indexnow --submit`. This sends one batch of the reviewed public
   URLs to IndexNow; no automatic deployment hook or background submission exists.
   HTTP 200/202 means accepted, not guaranteed indexing.
6. Verify ownership in Google Search Console and Bing Webmaster Tools and submit
   the generated sitemap. Use their URL inspection and structured-data tools.
   FAQ markup does not guarantee Google FAQ rich-result eligibility.
7. Ask the infrastructure owner to review Cloudflare's managed robots output,
   verified-bot handling, challenges, WAF rules, and rate limits for the listed
   crawlers. Do not disable protections or allow traffic solely by a spoofable
   User-Agent. Local robots rules cannot override an edge challenge or block.

## Remaining owner/external work

- Configure `SITE_URL=https://atlas.altimeda.com` in the production build,
  approve the indexing decision, and supply webmaster verification tokens
  and an optional IndexNow key.
- Approve business/product descriptions, legal text, existing placeholder-marked
  marketing claims, case-study evidence, and any future public articles.
- Plan actual Indonesian/English page variants before adding hreflang. No
  location-specific landing pages or unsupported industry outcomes were added.
- The existing hero embeds a large base64 image, and shared public layouts
  hydrate application providers. Further image/bundle optimization and measured
  Core Web Vitals are follow-up work, not claimed performance improvements.
- Run the document's 20-30-question cross-engine citation baseline with approved
  accounts and repeat monthly. Add verified GA4 attribution and infrastructure
  bot-log reporting only when actual analytics configuration and access exist.
- No external webmaster registration, IndexNow submission, Cloudflare change,
  production audit, or guaranteed ranking/citation claim is part of this patch.

## Validation results (2026-10-21)

Command names use their current pnpm equivalents; these results describe the
original checks on 2026-10-21, not a new validation run.

- `pnpm test:seo`: 14/14 dependency-free checks passed, including the
  owner-confirmed origin and explicit indexing opt-in regression check. With
  `SEO_TEST_ORIGIN=http://localhost:3000`, all 17/17 checks passed, including
  public HTML/metadata/JSON-LD, private noindex headers, authentication/legacy
  redirects, and disabled crawler endpoints.
- Playwright Chromium: all three public pages passed at 1440px and 390px with
  JavaScript disabled: one visible H1, initial styles, no loading overlay, and
  no horizontal overflow. With JavaScript enabled and external requests blocked,
  the mobile menu and landing/legal content worked without runtime errors.
- Targeted TypeScript validation of all 14 changed/new TypeScript entry points,
  including the project's auth type declarations: zero diagnostics.
- ESLint on all changed/new TypeScript and JavaScript files: passed.
  `git diff --check`: passed.
- Full `pnpm exec tsc --noEmit --incremental false`: failed on already-missing `sigma`,
  `graphology`, `graphology-communities-louvain`, `graphology-layout-forceatlas2`,
  `graphology-metrics`, and `vitest`, with cascading errors in existing graph code
  and tests. The initial baseline check showed the same dependency problems.
- Full `pnpm lint`: failed with 51 errors and 108 warnings in unchanged code,
  including React effect/state rules in workflow and settings components.
- `pnpm test`: could not launch the existing suite because the declared Vitest
  executable is not installed locally. The standalone SEO suite ran separately.
- `pnpm build`: failed with six module-resolution errors for the graph
  dependencies listed above. No type-check/build bypass or dependency version
  change was introduced to conceal these failures.
- A second dev-server startup attempt collided with the existing server's
  generated route type files. They were regenerated using Next.js route discovery;
  the final full TypeScript check returned to the original dependency errors.
  The existing port-3000 server was not stopped; no application source was lost.
- The Node-native tools emit a benign module-type auto-detection warning for
  `lib/seo.ts`. The package module type was not changed just to silence it.
- Production/Cloudflare behavior, authenticated company/role flows, external
  schema validators, webmaster verification, and actual IndexNow submission were
  not exercised. The public origin is now confirmed; live checks still require
  network approval, and service operations require the appropriate access.
- Dependency installation requiring network access remains pending approval.
