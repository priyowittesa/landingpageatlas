import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import { registerConnectorTypes } from "../lib/nodeConfig";
import {
  serializeCanvas,
  serializeCanvasForSave
} from "../lib/serializeCanvas";
import type { HttpSourceNodeConfig, NodeTypeDetail, WorkflowNode } from "../types";
import { FormSelect } from "./FormSelect";
import { NodeConfigFields } from "./NodeConfigForms";

type InputProps = {
  name: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
};
const mocks = vi.hoisted(() => ({
  nodeTypeDetail: vi.fn(),
  select: vi.fn<(props: ComponentProps<typeof FormSelect>) => void>(),
  inputs: new Map<string, InputProps>()
}));

function captureInput(type: unknown, props: unknown) {
  if (type !== "input" && type !== "textarea") return;
  const input = props as InputProps;
  if (input.name) mocks.inputs.set(input.name, input);
}

vi.mock("react/jsx-runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react/jsx-runtime")>();
  const capture =
    (fn: typeof actual.jsx) =>
    (...args: Parameters<typeof actual.jsx>) => {
      captureInput(args[0], args[1]);
      return fn(...args);
    };
  return { ...actual, jsx: capture(actual.jsx), jsxs: capture(actual.jsxs) };
});
vi.mock("react/jsx-dev-runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react/jsx-dev-runtime")>();
  return {
    ...actual,
    jsxDEV: (...args: Parameters<typeof actual.jsxDEV>) => {
      captureInput(args[0], args[1]);
      return actual.jsxDEV(...args);
    }
  };
});
vi.mock("../hooks/useNodeTypes", () => ({
  useGetNodeTypeDetail: mocks.nodeTypeDetail
}));
vi.mock("../hooks/useCredentials", () => ({
  useGetSecrets: () => ({
    data: { items: [{ id: "fabric-connection", name: "Fabric connection" }] }
  })
}));
vi.mock("../hooks/useExcelHeaders", () => ({}));
vi.mock("./FormSelect", () => ({
  FormSelect: (props: ComponentProps<typeof FormSelect>) => {
    mocks.select(props);
    return <div data-select={props.placeholder}>{props.value}</div>;
  }
}));

const operation = {
  description: "",
  request_fields: [],
  response_fields: []
};
const detail: NodeTypeDetail = {
  name: "fabric_rti",
  connector_type: "http",
  description: "",
  connection_params: [],
  resource_groups: {
    tables: { get_table_data: operation, list_tables: operation },
    queries: { execute_kql_query: operation }
  }
};
const baseConfig: HttpSourceNodeConfig = {
  type: "source",
  connector: "fabric_rti",
  connection_id: "fabric-connection",
  resource_group: "",
  operation: ""
};

function renderFields(
  config: Partial<HttpSourceNodeConfig>,
  nodeType = "fabric_rti",
  onChange: (patch: Record<string, unknown>) => void = vi.fn()
) {
  return renderToStaticMarkup(
    <NodeConfigFields
      nodeType={nodeType}
      config={{ ...baseConfig, ...config }}
      onChange={onChange}
    />
  );
}

describe("Fabric RTI node settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.inputs.clear();
    mocks.nodeTypeDetail.mockReturnValue({ data: detail });
    registerConnectorTypes([
      { name: "fabric_rti", connector_type: "http" },
      { name: "other_http", connector_type: "http" }
    ]);
  });

  afterEach(() => {
    useWorkflowStore.getState().reset();
    registerConnectorTypes([]);
  });

  it("shows a saved table_name directly below Operation for tables/get_table_data", () => {
    const html = renderFields({
      resource_group: "tables",
      operation: "get_table_data",
      table_name: "Telemetry"
    });

    expect(html).toContain('<label for="fabric-rti-table-name"');
    expect(html).toContain('name="table_name"');
    expect(html).toContain('value="Telemetry"');
    expect(html.indexOf("get_table_data")).toBeLessThan(
      html.indexOf('name="table_name"')
    );
    expect(html).not.toContain('name="kql_query"');
  });

  it("shows a saved multiline kql_query below Operation for queries/execute_kql_query", () => {
    const html = renderFields({
      resource_group: "queries",
      operation: "execute_kql_query",
      kql_query: "Telemetry\n| take 10"
    });

    expect(html).toContain('<label for="fabric-rti-kql-query"');
    expect(html).toMatch(/<textarea[^>]*name="kql_query"/);
    expect(html).toContain("Telemetry\n| take 10</textarea>");
    expect(html.indexOf("execute_kql_query")).toBeLessThan(
      html.indexOf('name="kql_query"')
    );
    expect(html).not.toContain('name="table_name"');
  });

  it.each([
    ["", ""],
    ["tables", ""],
    ["tables", "list_tables"],
    ["tables", "execute_kql_query"],
    ["queries", "get_table_data"]
  ])("hides both inputs for %s/%s", (resource_group, operation) => {
    const html = renderFields({
      resource_group,
      operation,
      table_name: "Previously selected table",
      kql_query: "Previously entered query"
    });
    expect(html).not.toContain('name="table_name"');
    expect(html).not.toContain('name="kql_query"');
  });

  it.each([
    ["tables", "get_table_data"],
    ["queries", "execute_kql_query"]
  ])("does not add Fabric inputs to other HTTP connectors: %s/%s", (resource_group, operation) => {
    const html = renderFields({ resource_group, operation }, "other_http");
    expect(html).not.toContain('name="table_name"');
    expect(html).not.toContain('name="kql_query"');
  });

  it.each([
    ["tables", "get_table_data", "table_name", "Telemetry"],
    ["queries", "execute_kql_query", "kql_query", "Telemetry\n| take 10"]
  ])("updates and persists %s/%s settings", (resource_group, operation, field, value) => {
    const config = { ...baseConfig, resource_group, operation };
    const onChange = vi.fn();
    renderFields(config, "fabric_rti", onChange);
    expect(mocks.inputs.get(field)?.value).toBe("");
    mocks.inputs.get(field)!.onChange({ target: { value } });
    expect(onChange).toHaveBeenCalledWith({ [field]: value });

    const node: WorkflowNode = {
      id: "fabric-node",
      type: "customNode",
      position: { x: 0, y: 0 },
      data: {
        nodeType: "fabric_rti",
        label: "Fabric RTI",
        category: "data_source",
        status: "active",
        runtime: "0.0s",
        config: {}
      },
      config
    };
    useWorkflowStore.setState({ nodes: [node] });
    renderFields(config, "fabric_rti", (patch) =>
      useWorkflowStore.getState().updateNodeConfig(node.id, patch)
    );
    mocks.inputs.get(field)!.onChange({ target: { value } });

    const { nodes, edges } = useWorkflowStore.getState();
    expect(nodes[0].config).toEqual({ ...config, [field]: value });
    expect(serializeCanvas(nodes, edges).nodes[0].config[field]).toBe(value);
    expect(serializeCanvasForSave(nodes, edges).nodes[0].config).toEqual({
      ...config,
      [field]: value
    });
  });

  it("resets the operation and hides its input when the resource group changes", () => {
    const onChange = vi.fn();
    const config = {
      ...baseConfig,
      resource_group: "tables",
      operation: "get_table_data"
    };
    renderFields(config, "fabric_rti", onChange);
    const groupSelect = mocks.select.mock.calls.find(
      ([props]) => props.placeholder === "Select a resource group..."
    )![0];
    groupSelect.onChange("queries");
    expect(onChange).toHaveBeenCalledWith({
      resource_group: "queries",
      operation: ""
    });
    const html = renderFields({ ...config, ...onChange.mock.lastCall![0] });
    expect(html).not.toContain('name="table_name"');
    expect(html).not.toContain('name="kql_query"');
  });
});
