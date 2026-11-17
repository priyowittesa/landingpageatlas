import assert from "node:assert/strict";
import { test } from "node:test";

import { hasModuleAccess, hasRouteAccess } from "./rbac-access.ts";

const moduleFor = (key, href, access_level) => ({
  id: key,
  key,
  name: key,
  href,
  access_level
});

test("predictive actions requires a module grant", () => {
  assert.equal(
    hasRouteAccess(undefined, "/app/operation-intelligence/predictive-actions"),
    false
  );
  assert.equal(
    hasRouteAccess(undefined, "/app/operation-intelligence/unrelated-page"),
    false
  );
  const modules = [{
    ...moduleFor("operation-inteliggence", "operation-intelligence"),
    sub_modules: [moduleFor("predictive-actions", "predictive-actions", "full_access")]
  }];
  assert.equal(hasRouteAccess(modules, "/app/operation-intelligence/predictive-actions"), true);
  modules[0].sub_modules[0].access_level = "no_access";
  assert.equal(hasRouteAccess(modules, "/app/operation-intelligence/predictive-actions"), false);
});

test("missing and invalid child grants cannot inherit access from a granted parent", () => {
  for (const access_level of [undefined, "", "unknown", "ACCESS_LEVEL_UNSPECIFIED"]) {
    const modules = [{
      ...moduleFor("operation-inteliggence", "operation-intelligence", "full_access"),
      sub_modules: [moduleFor("predictive-actions", "predictive-actions", access_level)]
    }];
    assert.equal(hasRouteAccess(modules, "/app/operation-intelligence/predictive-actions"), false);
  }
});

test("an ungranted container alone cannot unlock predictive actions", () => {
  for (const sub_modules of [undefined, [], [moduleFor("other", "other", "view_only")]]) {
    const modules = [{
      ...moduleFor("operation-inteliggence", "operation-intelligence"),
      sub_modules
    }];
    assert.equal(hasRouteAccess(modules, "/app/operation-intelligence/predictive-actions"), false);
  }
});

test("all supported child grants work under an ungranted container", () => {
  for (const access of [
    "view_only", "edit", "full_access",
    "ACCESS_LEVEL_VIEW_ONLY", "ACCESS_LEVEL_EDIT", "ACCESS_LEVEL_FULL_ACCESS"
  ]) {
    const modules = [{
      ...moduleFor("operation-inteliggence", "operation-intelligence"),
      sub_modules: [moduleFor("predictive-actions", "predictive-actions", access)]
    }];
    assert.equal(hasRouteAccess(modules, "/app/operation-intelligence/predictive-actions"), true);
  }
});

test("only granted modules unlock Well Performance", () => {
  const modules = [
    moduleFor("well-performance", "/well-performance", "full_access")
  ];
  assert.equal(
    hasModuleAccess(modules, "well-performance", "/well-performance"),
    true
  );
  assert.equal(
    hasModuleAccess(modules, "asset-management", "/asset-management"),
    false
  );
  assert.equal(
    hasModuleAccess(undefined, "well-performance", "/well-performance"),
    false
  );
});

test("route hrefs match even when the backend uses a different key", () => {
  const modules = [
    moduleFor("well-register", "/app/well-performance/", "edit")
  ];
  assert.equal(
    hasModuleAccess(modules, "well-performance", "/well-performance"),
    true
  );
});

test("no_access modules and descendants do not unlock routes", () => {
  const modules = [
    {
      ...moduleFor("well-performance", "/well-performance", "no_access"),
      sub_modules: [moduleFor("well-register", "/well-register", "view_only")]
    }
  ];
  assert.equal(
    hasModuleAccess(modules, "well-performance", "/well-performance"),
    false
  );
  assert.equal(
    hasModuleAccess(modules, "well-register", "/well-register"),
    false
  );
});

test("no_access blocks direct module URLs, details, and forms", () => {
  for (const access of ["no_access", "ACCESS_LEVEL_NO_ACCESS"]) {
    const modules = [
      moduleFor("asset-management", "/asset-management", access)
    ];
    for (const path of [
      "/app/asset-management",
      "/app/asset-management/asset-list",
      "/app/asset-management/asset-list/asset-id",
      "/app/asset-management/procurement/create",
      "/app/asset-management/procurement/request-id/edit"
    ]) {
      assert.equal(hasRouteAccess(modules, path), false, path);
    }
  }
});

test("view, edit, and full access still permit module URLs", () => {
  for (const access of ["view_only", "edit", "full_access", "ACCESS_LEVEL_VIEW_ONLY"]) {
    assert.equal(
      hasRouteAccess(
        [moduleFor("asset-management", "/app/asset-management/", access)],
        "/app/asset-management/asset-list/asset-id"
      ),
      true
    );
  }
});

test("a denied submodule is blocked without blocking allowed siblings", () => {
  const modules = [{
    ...moduleFor("inspection", "/inspection", "full_access"),
    sub_modules: [
      moduleFor("templates", "/templates", "ACCESS_LEVEL_NO_ACCESS"),
      moduleFor("products", "products", "view_only")
    ]
  }];
  for (const path of [
    "/app/inspection/templates",
    "/app/inspection/templates/new",
    "/app/inspection/templates/family/id/edit"
  ]) {
    assert.equal(hasRouteAccess(modules, path), false, path);
  }
  assert.equal(hasRouteAccess(modules, "/app/inspection/products/id"), true);
});

test("a denied parent blocks allowed descendants at every depth", () => {
  const modules = [{
    ...moduleFor("asset-management", "/asset-management", "no_access"),
    sub_modules: [{
      ...moduleFor("procurement", "/procurement", "full_access"),
      sub_modules: [moduleFor("receive-list", "/receive-list", "view_only")]
    }]
  }];
  assert.equal(
    hasRouteAccess(modules, "/app/asset-management/procurement/receive-list"),
    false
  );
});

test("missing grants do not unlock modules or similarly named routes", () => {
  for (const modules of [undefined, [], [moduleFor("inspection", "/inspection", "full_access")]]) {
    assert.equal(hasRouteAccess(modules, "/app/asset-management/asset-list"), false);
    assert.equal(hasRouteAccess(modules, "/app/inspection-other"), false);
  }
});

test("API hrefs support relative, nested and app-prefixed submodules", () => {
  for (const href of [
    "daily-activities",
    "/daily-activities/",
    "/daily-diaries/daily-activities",
    "/app/daily-diaries/daily-activities/"
  ]) {
    const modules = [{
      ...moduleFor("sample", "/daily-diaries", "edit"),
      sub_modules: [moduleFor("daily-activity", href, "no_access")]
    }];
    assert.equal(
      hasRouteAccess(modules, "/app/daily-diaries/daily-activities/project/new"),
      false,
      href
    );
    modules[0].sub_modules[0].access_level = "view_only";
    assert.equal(
      hasRouteAccess(modules, "/app/daily-diaries/daily-activities/project"),
      true,
      href
    );
  }
});

test("query strings and trailing slashes cannot bypass a denial", () => {
  const modules = [moduleFor("inspection", "/inspection/", "no_access")];
  assert.equal(hasRouteAccess(modules, "/app/inspection/?tab=products#details"), false);
});

test("URL-encoded paths cannot bypass a denied module in shared navigation", () => {
  const modules = [moduleFor("products", "/master-data/products", "no_access")];
  assert.equal(hasRouteAccess(modules, "/app/master-data/%70roducts/id"), false);
});

test("root grouping hrefs do not grant every unrelated module", () => {
  const modules = [{
    ...moduleFor("group", "/", "full_access"),
    sub_modules: [moduleFor("inspection", "/inspection", "view_only")]
  }];
  assert.equal(hasRouteAccess(modules, "/app/inspection/templates"), true);
  assert.equal(hasRouteAccess(modules, "/app/asset-management/asset-list"), false);
});

test("an operational dashboard denial cannot be bypassed through its alias", () => {
  const modules = [{
    ...moduleFor("well-performance", "/well-performance", "full_access"),
    sub_modules: [
      moduleFor("operational-dashboard", "/operational-dashboard", "no_access"),
      moduleFor("well-register", "/register", "view_only")
    ]
  }];
  assert.equal(hasRouteAccess(modules, "/app/operational-dashboard"), false);
  assert.equal(hasRouteAccess(modules, "/app/well-performance/register"), true);
});

test("duplicate or separately listed grants do not override denials", () => {
  const modules = [
    moduleFor("inspection", "/inspection", "no_access"),
    moduleFor("templates", "/inspection/templates", "full_access")
  ];
  assert.equal(hasRouteAccess(modules, "/app/inspection/templates/new"), false);
  assert.equal(hasRouteAccess(modules.toReversed(), "/app/inspection/templates/new"), false);
});

test("capacity and Well Performance use their canonical module routes", () => {
  for (const [key, href, path] of [
    ["capacity-analytic", "/master-data/capacity-analytic", "/app/capacity-analytic/loading-vs-capacity"],
    ["well-performance", "/well-performance", "/app/operational-dashboard"]
  ]) {
    assert.equal(hasRouteAccess([moduleFor(key, href, "no_access")], path), false);
    assert.equal(hasRouteAccess([moduleFor(key, href, "view_only")], path), true);
    assert.equal(hasRouteAccess([], path), false);
  }
});

test("shared workspace and account pages remain reachable without module grants", () => {
  for (const path of [
    "/app",
    "/app/workspace-dashboard",
    "/app/workspace-dashboard/explore-module",
    "/app/profile",
    "/app/role-access-management/role-id/edit",
    "/app/settings"
  ]) {
    assert.equal(hasRouteAccess([], path), true, path);
  }
});

test("Data Access and its edit routes require an explicit admin flag, not module grants", () => {
  for (const path of [
    "/app/data-access",
    "/app/data-access/module-id/edit",
    "/app/data-access/?tab=modules#details",
    "/app/%64ata-access/module-id/edit"
  ]) {
    for (const modules of [
      undefined,
      [],
      [moduleFor("data-access", "/data-access", "full_access")]
    ]) {
      for (const isAdmin of [undefined, false, null, "true", 1]) {
        assert.equal(hasRouteAccess(modules, path, isAdmin), false, path);
      }
      assert.equal(hasRouteAccess(modules, path, true), true, path);
    }
  }
});

test("an explicit denial also applies to modules rendered in static navigation", () => {
  assert.equal(
    hasRouteAccess(
      [moduleFor("products", "/master-data/products", "no_access")],
      "/app/master-data/products/id"
    ),
    false
  );
});

test("NEXA Evaluation preview requires admin access, including direct navigation", () => {
  for (const path of [
    "/app/nexa-evaluation",
    "/app/nexa-evaluation/?preview=true",
    "/app/%6eexa-evaluation"
  ]) {
    const modules = [moduleFor("nexa-evaluation", "/nexa-evaluation", "full_access")];
    for (const isAdmin of [undefined, false, "true", 1]) {
      assert.equal(hasRouteAccess(modules, path, isAdmin), false);
    }
    assert.equal(hasRouteAccess([], path, true), true);
  }
  assert.equal(hasRouteAccess([], "/app/nexa-evaluation-unrelated", true), false);
});

const TRIAGE_ROUTES = [
  "/app/asset-management/breakdown-triage",
  "/app/asset-management/breakdown-triage/ai-insights",
  "/app/asset-management/breakdown-triage/scoring"
];

test("Breakdown Triage follows Asset Management access until RBAC ships it", () => {
  const container = [{
    ...moduleFor("asset-management", "/asset-management"),
    sub_modules: [moduleFor("procurement", "/procurement", "full_access")]
  }];
  const granted = [moduleFor("asset-management", "/asset-management", "view_only")];
  for (const modules of [container, granted]) {
    for (const path of TRIAGE_ROUTES) assert.equal(hasRouteAccess(modules, path), true, path);
  }
});

test("Breakdown Triage stays blocked without accessible Asset Management", () => {
  const cases = [
    undefined,
    [moduleFor("inspection", "/inspection", "full_access")],
    [moduleFor("asset-management", "/asset-management", "no_access")],
    [{
      ...moduleFor("asset-management", "/asset-management"),
      sub_modules: [moduleFor("procurement", "/procurement", "no_access")]
    }],
    [{
      ...moduleFor("asset-management", "/asset-management", "no_access"),
      sub_modules: [moduleFor("procurement", "/procurement", "full_access")]
    }]
  ];
  for (const modules of cases) {
    assert.equal(hasRouteAccess(modules, TRIAGE_ROUTES[0]), false, JSON.stringify(modules));
  }
});

test("a Breakdown Triage RBAC entry takes over from the Asset Management fallback", () => {
  const modules = [{
    ...moduleFor("asset-management", "/asset-management", "full_access"),
    sub_modules: [moduleFor("breakdown-triage", "/breakdown-triage", "no_access")]
  }];
  assert.equal(hasRouteAccess(modules, TRIAGE_ROUTES[0]), false);
  assert.equal(hasRouteAccess(modules, "/app/asset-management/asset-list"), true);
});
