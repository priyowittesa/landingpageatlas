# Capacity Analytic Integration Coverage

Implementation scope: `capacity-analytic-fe-integration.md`, confirmed against the
gateway Swagger and the v1 proto files supplied for this integration.

## Implemented Frontend Flows

- Dashboard KPIs, production parts, backend capacity statuses, and period/plan filters.
- Activity plans: list, detail loading, creation, full-field updates, and confirmed deletion.
- Marketing/master-part uploads, binary templates, processing logs, history, and detail output.
- Unmatched parts: waiting/resolved/all filters and confirmed manual remapping.
- Loading vs capacity: N-1 through N+3, independent Before/After data, resume table,
  overtime logs, additional-working-days summary, and bridging history.
- Capacity trend: annual line selection, previous year, shift simulations, and line-filtered bridging history.
- Overtime: creation, detail loading, editing with immutable line, and confirmed deletion.
- Bridging: source-line parts, preview, submit, approve/reject with notes, and cancellation.
- Formula configuration: assignments, scope/status/search filters, catalogue-driven editor,
  per-target scope information, validation/suggestions, preview, draft persistence,
  review/impact, confirmed activation, deletion, history, and backend token comparison.
- Tenant capacity thresholds: read/update/reset without frontend status calculations.
- Product Structure: API-backed hierarchy and tables; product, group, line, part, and
  assembly-component creation/editing/deletion; actual status IDs and status management.
- Production-line shift/station inputs, optional part labor time, monthly downtime/man-hours.

## Important Contract Details

- Master data uses `product_code`/`product_name`, `group_code`/`group_name`,
  `line_code`/`line_name`, and `part_number`/`part_name`, not generic code/name fields.
- Master list endpoints support at most 200 records per page. Selectors/hierarchy follow cursor tokens.
- Filtering master lines by product/group is derived from the actual parent IDs;
  unknown query filters are not sent. Source-line parts use the nested line/parts route.
- Assembly records are relationships (`parent_part_id`, `component_part_id`, `usage`),
  not new part definitions. Updates cannot change the component or parent.
- Parent IDs, identity/audit fields, and immutable overtime line IDs are excluded from updates.
- Optional shift/station/labor fields remain omitted when blank during an edit.
  Explicit labor time 0 clears it.
- Additional working days and line-capacity responses are summaries, not cursor-paginated lists.
- Missing capacity/absorbed-loading values remain unavailable, while real zeroes remain zero.

## Verification Boundary

Automated tests and browser checks use mocked gateway responses and never modify live data.
Swagger has been checked read-only. Unauthenticated master-data GET checks return HTTP 401,
as expected; authenticated tenant data and real spreadsheets still require a signed-in smoke test.

Latest local verification:

- 52 focused tests pass, including Product Structure request contracts.
- Both mocked browser suites pass, covering the original six views plus the new
  management workflows and Product Structure mobile layout.
- Changed-file ESLint, production build, SEO checks, and `git diff --check` pass.
- Full suite: 891 tests pass; the existing AI-assistant panel-cancellation test fails.
- Full type check reports existing daily-diaries test fixture `ProjectStatus` errors;
  no Capacity Analytic or Product Structure type errors are reported.

## Supplied Excel Files: Local Inspection

The supplied `1_master_part.xlsx` and `2_marketing_data.xlsx` were read locally
without changing either file or sending them to the gateway.

- Master part: one sheet, five distinct parts, and three assigned line codes.
- Marketing: two product sheets, 20 rows, and five distinct part numbers, covering
  November 2026 through February 2027.
- Required headers match the documented format. No duplicate master part numbers
  or duplicate marketing part/period/plan keys were found.
- Numeric fields, periods, and plan values pass local checks. Every marketing
  part number exists in the supplied master workbook.
- Both files are below 10 MB. No formula cells or archive corruption were found.

This verifies the supplied file structure against the guide, not acceptance by
the actual backend importer. Tenant product/line relationships, existing records,
status defaults, real import results, and post-import analytics remain unverified.
Do not import without approval: master rows can update existing parts, and
marketing rows replace existing values for the included part/period combinations.

The guide's backend/product uncertainties remain: live Excel import acceptance,
loading/threshold/trend assumptions, additional formula scope levels, and bridging approval role policy.
