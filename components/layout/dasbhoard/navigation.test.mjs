import assert from "node:assert/strict";
import { test } from "node:test";

import { buildNavigation, extractNavHrefs } from "./navigation.ts";

const moduleFor = (key, href) => ({
  id: key,
  key,
  name: key,
  href,
  access_level: "view_only"
});

test("Capacity Analytic includes its dashboard before the analysis screens", () => {
  const sections = buildNavigation({
    modules: [moduleFor("capacity-analytic", "/capacity-analytic")]
  });
  const capacity = sections.find((section) => section.title === "Modules").items[0];
  assert.equal(capacity.children[0].title, "Dashboard");
  assert.equal(capacity.children[0].href, "/app/capacity-analytic/dashboard");
  assert.equal(extractNavHrefs(sections).filter((href) => href === "/app/capacity-analytic/dashboard").length, 1);
});

test("Capacity Analytic keeps explicit submodule permissions authoritative", () => {
  const sections = buildNavigation({
    modules: [{
      ...moduleFor("capacity-analytic", "/capacity-analytic"),
      sub_modules: [moduleFor("capacity-trend", "/capacity-trend")]
    }]
  });
  assert.equal(extractNavHrefs(sections).includes("/app/capacity-analytic/dashboard"), false);
  assert.ok(extractNavHrefs(sections).includes("/app/capacity-analytic/capacity-trend"));
});

test("Master Data moves into Others while Settings remains a menu item", () => {
  const sections = buildNavigation({
    modules: [moduleFor("products", "/master-data/products")]
  });
  assert.deepEqual(
    sections.map((section) => section.title),
    ["Overview", "Modules", "Others"]
  );

  const others = sections.find((section) => section.title === "Others");
  assert.deepEqual(
    others.items.map((item) => item.title),
    ["Master Data", "Settings"]
  );
  assert.equal(others.items[0].defaultOpen, false);
  assert.deepEqual(
    others.items[0].children.map((child) => child.href),
    [
      "/app/master-data/employee",
      "/app/master-data/projects",
      "/app/master-data/rate-cards",
      "/app/master-data/equipment",
      "/app/master-data/products",
      "/app/master-data/product-structure"
    ]
  );
  assert.equal(others.items[1].href, "/app/settings");
  assert.equal(
    extractNavHrefs(sections).filter(
      (href) => href === "/app/master-data/products"
    ).length,
    1
  );
});

test("Others preserves role and subscription navigation", () => {
  const sections = buildNavigation({
    modules: [moduleFor("example", "/example")],
    roles: ["default-roles-atlas"],
    hasSubscription: true
  });
  const others = sections.find((section) => section.title === "Others");
  assert.deepEqual(
    others.items.map((item) => item.title),
    [
      "Master Data",
      "Role Access Management",
      "Settings",
      "Token Usage"
    ]
  );
});

test("Data Access stays hidden unless is_admin is explicitly true", () => {
  const modules = [moduleFor("example", "/example")];
  for (const ctx of [
    {},
    { modules },
    { isAdmin: false, modules: [] },
    { isAdmin: "true" },
    { modules, roles: ["default-roles-atlas"], hasSubscription: true },
    { roles: ["default-roles-atlas"] },
    { hasSubscription: true }
  ]) {
    const sections = buildNavigation(ctx);
    assert.equal(extractNavHrefs(sections).includes("/app/data-access"), false);
  }
});

test("Data Access appears once in Others for admins regardless of modules or subscription", () => {
  for (const ctx of [
    {},
    { modules: [moduleFor("example", "/example")] },
    { roles: ["default-roles-atlas"] },
    { hasSubscription: true }
  ]) {
    const sections = buildNavigation({ ...ctx, isAdmin: true });
    const others = sections.find((section) => section.title === "Others");
    assert.equal(
      others.items.filter((item) => item.href === "/app/data-access").length,
      1
    );
  }
});

test("NEXA Evaluation preview appears in Others only for explicit admins", () => {
  for (const isAdmin of [undefined, false, "true", true]) {
    const sections = buildNavigation({ isAdmin });
    const links = extractNavHrefs(sections).filter(
      (href) => href === "/app/nexa-evaluation"
    );
    assert.equal(links.length, isAdmin === true ? 1 : 0);
    if (isAdmin === true) {
      assert.ok(sections.find((section) => section.title === "Others").items.some(
        (item) => item.title === "NEXA Evaluation"
      ));
    }
  }
});

test("Master Data stays hidden without RBAC modules", () => {
  for (const ctx of [
    {},
    { isAdmin: true },
    { roles: ["default-roles-atlas"] },
    { hasSubscription: true }
  ]) {
    const sections = buildNavigation(ctx);
    assert.equal(
      extractNavHrefs(sections).some((href) =>
        href.startsWith("/app/master-data/")
      ),
      false
    );
    assert.equal(
      sections.some((section) => section.title === "Settings"),
      false
    );
    assert.equal(
      sections.some((section) => section.title === "Others"),
      Object.keys(ctx).length > 0
    );
  }
});

test("Intelligence uses Pertamina branding only for Pertamina Group", () => {
  const modules = [
    {
      ...moduleFor("synergy-intellegence", "/synergy-intelligence"),
      name: "Synergy Intelligence"
    },
    moduleFor("other-module", "/other-module")
  ];

  for (const companyName of [
    "Pertamina Group",
    "Other Company",
    "pertamina group",
    "Pertamina Group ",
    "",
    undefined
  ]) {
    const section = buildNavigation({ modules, companyName }).find(
      (section) => section.title === "Modules"
    );
    assert.equal(
      section.items[0].title,
      companyName === "Pertamina Group"
        ? "Pertamina Intelligence"
        : "NEXA Intelligence"
    );
    assert.equal(section.items[0].href, "/app/synergy-intelligence");
    assert.equal(section.items[1].title, "other-module");
  }
});

test("nested Intelligence modules use the same company-specific branding", () => {
  const modules = [
    {
      ...moduleFor("parent", "/parent"),
      sub_modules: [
        {
          ...moduleFor("synergy-intellegence", "/synergy-intelligence"),
          name: "Synergy Intelligence"
        }
      ]
    }
  ];

  for (const companyName of ["Pertamina Group", "Other Company", undefined]) {
    const section = buildNavigation({ modules, companyName }).find(
      (section) => section.title === "Modules"
    );
    assert.equal(
      section.items[0].children[0].title,
      companyName === "Pertamina Group"
        ? "Pertamina Intelligence"
        : "NEXA Intelligence"
    );
  }
});

test("Predictive Actions and Well Performance require RBAC navigation entries", () => {
  const withoutAccess = buildNavigation();
  assert.equal(extractNavHrefs(withoutAccess).includes("/app/operation-intelligence/predictive-actions"), false);
  assert.equal(
    extractNavHrefs(withoutAccess).includes("/app/well-performance/dashboard"),
    false
  );

  const pertaminaSections = buildNavigation({ companyName: "Pertamina Group" });
  assert.equal(
    extractNavHrefs(pertaminaSections).includes("/app/operation-intelligence/predictive-actions"),
    false
  );
  assert.equal(
    extractNavHrefs(pertaminaSections).includes(
      "/app/well-performance/register"
    ),
    false
  );

  const sections = buildNavigation({
    companyName: "Other Company",
    modules: [moduleFor("well-performance", "/well-performance")]
  });
  const modules = sections.find((section) => section.title === "Modules");
  assert.deepEqual(
    modules.items.map((item) => item.title),
    ["well-performance"]
  );
  assert.equal(extractNavHrefs(sections).includes("/app/operation-intelligence/predictive-actions"), false);
  assert.equal(
    extractNavHrefs(sections).includes("/app/well-performance/register"),
    true
  );
  assert.equal(
    extractNavHrefs(sections).includes("/app/operational-dashboard"),
    true
  );
});

test("auth/me Operation Intelligence payload renders a nested RBAC menu for any company", () => {
  const modules = [{
    id: "7ea4925e-f056-4fae-9bbf-f50b157f5ec6",
    key: "operation-inteliggence",
    name: "Operation Intelligence",
    icon: "sparkles",
    href: "operation-intelligence",
    order: 0,
    sub_modules: [{
      id: "69930798-d173-4300-84d7-a1f89eae2801",
      key: "predictive-actions",
      name: "Predictive Actions",
      icon: "sparkles",
      href: "predictive-actions",
      order: 0,
      access_level: "full_access",
      sub_modules: []
    }]
  }];
  for (const companyName of [undefined, "Other Company", "Pertamina Group"]) {
    const sections = buildNavigation({ modules, companyName });
    const node = sections.find((section) => section.title === "Modules").items[0];
    assert.equal(node.title, "Operation Intelligence");
    assert.equal(node.iconName, "sparkles");
    assert.equal(node.href, undefined);
    assert.equal(node.children[0].title, "Predictive Actions");
    assert.equal(node.children[0].iconName, "sparkles");
    assert.equal(node.children[0].href, "/app/operation-intelligence/predictive-actions");
    assert.equal(extractNavHrefs(sections).filter(
      (href) => href === "/app/operation-intelligence/predictive-actions"
    ).length, 1);
  }
  modules[0].sub_modules[0].access_level = "no_access";
  assert.equal(extractNavHrefs(buildNavigation({ modules })).includes(
    "/app/operation-intelligence/predictive-actions"
  ), false);
  assert.equal(buildNavigation({ modules }).some((section) => section.items.some(
    (node) => node.title === "Operation Intelligence"
  )), false);
  modules[0].access_level = "no_access";
  assert.equal(extractNavHrefs(buildNavigation({ modules })).includes(
    "/app/operation-intelligence"
  ), false);
});

test("ungranted leaves cannot appear or restore procurement fallback links", () => {
  for (const access_level of [undefined, "", "unknown", "ACCESS_LEVEL_UNSPECIFIED"]) {
    const sections = buildNavigation({
      modules: [{
        ...moduleFor("asset-management", "/asset-management"),
        sub_modules: [{
          ...moduleFor("procurement", "/procurement"),
          sub_modules: [{
            ...moduleFor("approvals-inbox", "/approvals-inbox"), access_level
          }]
        }]
      }]
    });
    assert.equal(extractNavHrefs(sections).includes(
      "/app/asset-management/procurement/approvals-inbox"
    ), false);
  }
});

test("a no_access Well Performance module does not appear in navigation", () => {
  const sections = buildNavigation({
    modules: [
      {
        ...moduleFor("well-performance", "/well-performance"),
        access_level: "no_access"
      }
    ]
  });
  assert.equal(
    extractNavHrefs(sections).includes("/app/well-performance/register"),
    false
  );
});

test("denied submodules stay hidden while allowed siblings remain visible", () => {
  const sections = buildNavigation({
    modules: [{
      ...moduleFor("inspection", "/inspection"),
      sub_modules: [
        { ...moduleFor("templates", "/templates"), access_level: "ACCESS_LEVEL_NO_ACCESS" },
        moduleFor("products", "/products")
      ]
    }]
  });
  const hrefs = extractNavHrefs(sections);
  assert.equal(hrefs.includes("/app/inspection/templates"), false);
  assert.equal(hrefs.includes("/app/inspection/products"), true);
});

test("fallback navigation cannot restore explicitly denied Well Performance pages", () => {
  const sections = buildNavigation({
    modules: [{
      ...moduleFor("well-performance", "/well-performance"),
      sub_modules: [{
        ...moduleFor("well-register", "/register"),
        access_level: "no_access"
      }]
    }]
  });
  assert.equal(
    extractNavHrefs(sections).includes("/app/well-performance/register"),
    false
  );
});

test("procurement fallback links do not restore denied submodules", () => {
  const sections = buildNavigation({
    modules: [{
      ...moduleFor("asset-management", "/asset-management"),
      sub_modules: [{
        ...moduleFor("procurement", "/procurement"),
        sub_modules: [
          { ...moduleFor("approvals-inbox", "/approvals-inbox"), access_level: "no_access" },
          { ...moduleFor("receive-list", "/receive-list"), access_level: "no_access" }
        ]
      }]
    }]
  });
  const hrefs = extractNavHrefs(sections);
  assert.equal(hrefs.includes("/app/asset-management/procurement"), true);
  assert.equal(hrefs.includes("/app/asset-management/procurement/approvals-inbox"), false);
  assert.equal(hrefs.includes("/app/asset-management/procurement/receive-list"), false);
});

test("API icon names work for modules and sub-modules without key mappings", () => {
  const sections = buildNavigation({
    modules: [
      {
        ...moduleFor("dashboard", "well-performance"),
        name: "Well Performance",
        icon: "layout-dashboard",
        sub_modules: [
          { ...moduleFor("analytics", "analytics"), icon: "chart-line" },
          {
            ...moduleFor("well-dashboard", "dashboard"),
            icon: "layout-dashboard"
          },
          { ...moduleFor("monitor", "monitor"), icon: "gauge" },
          { ...moduleFor("well-register", "register"), icon: "layout-list" }
        ]
      }
    ]
  });
  const wellPerformance = sections.find(
    (section) => section.title === "Modules"
  ).items[0];
  assert.equal(wellPerformance.iconName, "layout-dashboard");
  assert.deepEqual(
    wellPerformance.children.map((child) => child.iconName),
    ["chart-line", "layout-dashboard", "gauge", "layout-list"]
  );
  assert.deepEqual(
    wellPerformance.children.map((child) => child.href),
    [
      "/app/well-performance/analytics",
      "/app/well-performance/dashboard",
      "/app/well-performance/monitor",
      "/app/well-performance/register"
    ]
  );
});

const assetManagementWith = (subModules) => {
  const sections = buildNavigation({
    modules: [
      {
        ...moduleFor("asset-management", "/asset-management"),
        sub_modules: subModules
      }
    ]
  });
  return sections.find((section) => section.title === "Modules").items[0];
};

const TRIAGE_PAGES = [
  "/app/asset-management/breakdown-triage",
  "/app/asset-management/breakdown-triage/ai-insights",
  "/app/asset-management/breakdown-triage/scoring"
];
const pageHrefs = (nodes) => nodes.flatMap((node) => (node.children ? pageHrefs(node.children) : [node.href]));

test("Breakdown Triage is added to Asset Management right after Procurement", () => {
  const assetManagement = assetManagementWith([
    moduleFor("asset-list", "/asset-list"),
    moduleFor("procurement", "/procurement"),
    moduleFor("work-orders", "/work-orders")
  ]);
  assert.deepEqual(
    assetManagement.children.map((child) => child.title),
    ["asset-list", "procurement", "Breakdown Triage", "work-orders"]
  );
  const triage = assetManagement.children[2];
  assert.equal(triage.href, undefined);
  assert.deepEqual(pageHrefs(triage.children), TRIAGE_PAGES);
  // Synonym Dictionary and LLM Attribute Review are hidden from the menu for now.
  assert.deepEqual(triage.children.at(-1).children.map((child) => child.title), ["Scoring & Thresholds"]);
});

test("Breakdown Triage is appended when Asset Management has no Procurement", () => {
  const assetManagement = assetManagementWith([moduleFor("asset-list", "/asset-list")]);
  assert.equal(assetManagement.children.at(-1).title, "Breakdown Triage");
});

test("a denied Breakdown Triage module from the API is not re-added", () => {
  const assetManagement = assetManagementWith([
    moduleFor("procurement", "/procurement"),
    { ...moduleFor("breakdown-triage", "/breakdown-triage"), access_level: "no_access" }
  ]);
  assert.equal(
    assetManagement.children.some((child) => child.baseHref?.endsWith("/breakdown-triage")),
    false
  );
});

test("a Breakdown Triage leaf from the API gets the triage pages", () => {
  const assetManagement = assetManagementWith([
    { ...moduleFor("breakdown-triage", "/breakdown-triage"), name: "Breakdown Triage" }
  ]);
  const triage = assetManagement.children.filter((child) => child.title === "Breakdown Triage");
  assert.equal(triage.length, 1);
  assert.deepEqual(pageHrefs(triage[0].children), TRIAGE_PAGES);
});

test("unknown API icon names retain a fallback icon", () => {
  const sections = buildNavigation({
    modules: [{ ...moduleFor("new-module", "new-module"), icon: "not-an-icon" }]
  });
  const node = sections.find((section) => section.title === "Modules").items[0];
  // Unknown names are passed through; NavItem renders `icon` when it cannot resolve them.
  assert.equal(node.iconName, "not-an-icon");
  assert.ok(node.icon);
});
