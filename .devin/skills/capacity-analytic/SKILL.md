---
name: capacity-analytic
description: Integrate, maintain, and test the Capacity Analytic module, its manufacturing line-balancing APIs, uploads, contingency plans, and versioned formula editor.
argument-hint: "[screen or integration task]"
---

# Capacity Analytic

Use this skill for work under `app/app/capacity-analytic`, including dashboard,
loading vs capacity, capacity trend, contingency planning, and formula configuration.
Preserve the established UI and shared components rather than redesigning these screens.

## Read First

1. Read `AGENTS.md` and `.devin/capacity-analytic/capacity-analytic-fe-integration.md`.
   The latter is the backend contract, including endpoint semantics and known limitations.
2. Inspect `api-types.ts`, `api.ts`, `use-capacity.ts`, and `analytics.ts` inside
   `app/app/capacity-analytic`.
3. Inspect the relevant page and its tests before editing. Old mock constants in
   legacy `types.ts` files and unused preview components are not live API data.
4. Read `.devin/capacity-analytic/API-COVERAGE.md` for implemented workflows and
   the boundary between mocked tests and authenticated gateway verification.

## API Rules

- Base path: `/v1/manufacturing/line-balancing`. Use the shared authenticated
  `axiosConfig` client; do not read tokens from storage or bypass token refresh.
- Tenant and actor identities come from the gateway credentials. Never add tenant,
  created_by, activated_by, or similar identity fields to request bodies.
- Objects are in `response.data.data`; lists contain `items`, `total_count`, and
  `next_page_token`. Carry real cursor tokens, never synthesize page offsets.
- JSON fields are snake_case. Dates use `YYYY-MM-DD`; periods use numeric year/month.
  Query enums may use short values; JSON bodies must use full enum names.
- Analytics filters are dotted keys: `filter.product_id`, `filter.line_group_id`,
  `filter.line_id`. Resolve selector IDs from master-data endpoints, not sample codes.
- Optional capacity values are unknown, not zero. Show `-`, omit unknown chart bars,
  preserve real zeroes, and expose `problem` where available.
- Use API statuses and `thresholds`; never calculate Normal/Warning/NG in the frontend.
  Follow `analytics.ts` for N Before/After and N+2 Before/After mapping.
- Surface nested `error.message` for validation/conflict/precondition errors.
  Keep forms open on failure; never toast success before the server accepts a write.

## Queries And Tables

- Include authenticated user/tenant scope and all applied filters in TanStack Query keys.
  Gate queries until authentication is ready and invalidate the scoped module after writes.
- Read-only validation/preview POSTs use `useCapacityPreview` and do not invalidate analytics.
- Use `components/ApiTable.tsx`, which wraps the repository's shared `components/Table.tsx`,
  for cursor-paginated API lists. Reset pagination when search, page size, or filters change.
- Fetch all master-selector pages using `capacityListAll`; guard repeated page tokens.
  Never quietly treat malformed responses as an empty successful result.

## Uploads And Contingency

- Upload `.xlsx` only, at most 10 MB, as multipart field `file`. Let the browser supply
  the boundary; remove the shared JSON content-type header.
- Template downloads are binary `.xlsx`, not JSON. Release object URLs after download.
- HTTP 201 can contain `DATA_UPLOAD_STATUS_FAILED`. Render the returned status and ordered
  processing logs, including warning/error levels. Refresh dashboard after either upload kind.
- Bridging requires source/target line IDs, a source part ID, numeric quantity and period.
  Preview the exact payload before submission; clear stale previews whenever inputs change.
- Newly submitted bridging is pending review and does not change capacity until approved.
- Overtime hours must be greater than zero and at most 24. Use real line IDs and ISO dates.
- Overtime updates cannot move a log to another line. Preview bridging excludes the
  submit-only `note` field. The additional-working-days response has `items` only,
  without cursor pagination or total_count.

## Product Structure

- Code is under `app/app/master-data/product-structure`; its `api.ts` defines
  proto-backed request fields and immutable relationships.
- Products/groups/lines use their specific snake_case code/name fields. Use
  `masterLabel` for selectors rather than assuming all resources have `code`/`name`.
- Status choices come from `/statuses?entity_type=...`; send `status_id`, not labels.
- Assembly components reference existing parts. Update only usage/status, never parent/component IDs.
- Blank optional shift/station/labor inputs preserve stored values; labor time 0 explicitly clears it.
- Monthly input PUT replaces both downtime and man-hours for the selected line/period.

## Formulas

- Read variables, conversion constants, templates, labels, units, descriptions, and sources
  from `/formulas/catalog`; do not revive the old hardcoded variable aliases.
- Use `formula-configuration/formula-api.ts` for token round-tripping and draft persistence.
  Preserve parentheses, functions, commas, numeric units, and custom labels.
- Refresh scope-info when level, target, or effective date changes. Global has no scope IDs.
  More-specific formulas override inherited formulas; previews must show this.
- Debounce validation and never show a stale validation result as current. Use backend
  reads_as, error.token_index, and error.suggestion.tokens.
- Drafts may be incomplete. Only drafts can be updated; active/scheduled/superseded
  versions create a new draft. Changing scope must never update the old scope's draft.
- Review and activation start from saved IDs. Load `/review` and `/impact`, show backend
  changed-token flags and activation_blocker, require a reason, and activate only on confirm.
- Multi-target creation returns multiple formula_versions. Review every target; retain
  successful activations if a later target fails so retries do not activate twice.
- History compares through `/formulas/compare`, not a label-only frontend diff.

## Verify

Use only the pinned pnpm version:

```sh
pnpm exec vitest run app/app/capacity-analytic
pnpm exec vitest run app/app/master-data/product-structure
pnpm exec eslint <changed-ts-and-tsx-files>
pnpm exec tsc --noEmit --incremental false
pnpm test
pnpm build
```

Cover pagination, missing vs zero values, tenant thresholds, upload failures returned with
201, exact request bodies, immutable formula versions, validation, and cache invalidation.
Report unrelated repository failures separately. Authenticated routes require a valid
session; do not claim a live gateway smoke test unless one was actually performed.
