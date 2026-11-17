"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useGetModules } from "@/app/app/workspace-dashboard/explore-module/use-packages";
import {
  extractFolders,
  useKnowledgeApi
} from "@/app/app/ai-studio/atlas-knowledge-source/use-knowledge";
import { parseNexaDataSources } from "../lib/nodeConfig";
import { useGetNodeTypeDetail } from "../hooks/useNodeTypes";
import { FormSelect } from "./FormSelect";
import type { NodeField } from "../types";

export interface SelectedOperation {
  fields: string[];
  fieldValues: Record<string, string>;
  requestParams: Record<string, string | string[]>;
}

export type SelectedOperations = Record<string, SelectedOperation>;

interface ResourceGroupSelectorProps {
  nodeName: string;
  nodeConfig?: Record<string, unknown>;
  selectedOperations: SelectedOperations;
  onChange: (selected: SelectedOperations) => void;
  fixedResourceGroup?: string;
  fixedOperation?: string;
  fixedRequestParams?: Record<string, string>;
}

export function ResourceGroupSelector({
  nodeName,
  nodeConfig,
  selectedOperations,
  onChange,
  fixedResourceGroup,
  fixedOperation,
  fixedRequestParams
}: ResourceGroupSelectorProps) {
  const { data, isLoading, isError } = useGetNodeTypeDetail(nodeName);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const resourceGroupNames = useMemo(
    () =>
      fixedResourceGroup
        ? [fixedResourceGroup]
        : data
          ? Object.keys(data.resource_groups)
          : [],
    [data, fixedResourceGroup]
  );
  const activeGroup =
    fixedResourceGroup ??
    selectedGroup ??
    resourceGroupNames.find((name) => name.toLowerCase() === "default") ??
    "";

  const requestParamDefaults = useMemo(() => {
    const defaults: Record<string, Record<string, string | string[]>> = {};
    if (!data || !nodeConfig) return defaults;

    for (const group of Object.values(data.resource_groups)) {
      for (const [opName, operation] of Object.entries(group)) {
        const params: Record<string, string | string[]> = {};
        for (const field of operation.request_fields) {
          if (!Object.hasOwn(nodeConfig, field.name)) continue;
          const value = nodeConfig[field.name];
          if (nodeName === "nexa_chat" && field.name === "data_sources") {
            params[field.name] = parseNexaDataSources(value);
            continue;
          }
          const serialized =
            typeof value === "string" ? value : JSON.stringify(value);
          if (serialized !== undefined) params[field.name] = serialized;
        }
        defaults[opName] = params;
      }
    }
    return defaults;
  }, [data, nodeConfig, nodeName]);

  const operationsWithValues = useMemo(() => {
    let next = selectedOperations;
    for (const [opName, selection] of Object.entries(selectedOperations)) {
      const defaults = requestParamDefaults[opName] ?? {};
      const currentParams = selection.requestParams ?? {};
      if (
        Object.keys(defaults).some((key) => !Object.hasOwn(currentParams, key))
      ) {
        next = {
          ...next,
          [opName]: {
            ...selection,
            requestParams: { ...defaults, ...currentParams }
          }
        };
      }
    }
    return next;
  }, [requestParamDefaults, selectedOperations]);

  const operations = useMemo(() => {
    if (!data || !activeGroup) return [];
    const group = data.resource_groups[activeGroup];
    if (!group) return [];
    return Object.entries(group)
      .filter(([opName]) => !fixedOperation || opName === fixedOperation)
      .map(([opName, op]) => ({
        name: opName,
        description: op.description,
        requestFields: op.request_fields,
        responseFields: op.response_fields
      }));
  }, [activeGroup, data, fixedOperation]);

  useEffect(() => {
    let next = operationsWithValues;
    if (fixedOperation) {
      const current = next[fixedOperation];
      const hasChanged =
        !current ||
        Object.keys(next).some((name) => name !== fixedOperation) ||
        Object.entries(fixedRequestParams ?? {}).some(
          ([key, value]) => current.requestParams?.[key] !== value
        );

      if (hasChanged) {
        next = {
          [fixedOperation]: {
            fields: current?.fields ?? [],
            fieldValues: current?.fieldValues ?? {},
            requestParams: {
              ...(requestParamDefaults[fixedOperation] ?? {}),
              ...(current?.requestParams ?? {}),
              ...(fixedRequestParams ?? {})
            }
          }
        };
      }
    }
    if (next !== selectedOperations) onChange(next);
  }, [
    fixedOperation,
    fixedRequestParams,
    onChange,
    operationsWithValues,
    requestParamDefaults,
    selectedOperations
  ]);

  const toggleOperation = (opName: string) => {
    const next = { ...operationsWithValues };
    if (next[opName]) {
      delete next[opName];
    } else {
      next[opName] = {
        fields: [],
        fieldValues: {},
        requestParams: { ...(requestParamDefaults[opName] ?? {}) }
      };
    }
    onChange(next);
  };

  const toggleField = (opName: string, fieldName: string) => {
    const current = operationsWithValues[opName];
    if (!current) return;
    const fields = current.fields.includes(fieldName)
      ? current.fields.filter((f) => f !== fieldName)
      : [...current.fields, fieldName];
    onChange({ ...operationsWithValues, [opName]: { ...current, fields } });
  };

  const setRequestParam = (
    opName: string,
    paramName: string,
    value: string | string[]
  ) => {
    const current = operationsWithValues[opName];
    if (!current) return;
    onChange({
      ...operationsWithValues,
      [opName]: {
        ...current,
        requestParams: { ...current.requestParams, [paramName]: value }
      }
    });
  };

  const setFieldValue = (opName: string, fieldName: string, value: string) => {
    const current = operationsWithValues[opName];
    if (!current) return;
    onChange({
      ...operationsWithValues,
      [opName]: {
        ...current,
        fieldValues: { ...current.fieldValues, [fieldName]: value }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading resources...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 text-center text-xs text-red-400">
        Failed to load resources
      </div>
    );
  }

  if (resourceGroupNames.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-gray-400">
        No resources available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-700">
          Resource Group
        </label>
        <FormSelect
          value={activeGroup}
          onChange={setSelectedGroup}
          placeholder="Select a resource group..."
          disabled={!!fixedResourceGroup}
          options={resourceGroupNames.map((name) => ({
            value: name,
            label: name
          }))}
        />
      </div>

      {activeGroup && operations.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">
            Operations
          </label>
          <div className="space-y-1">
            {operations.map((op) => {
              const selection = operationsWithValues[op.name];
              const isFixed = op.name === fixedOperation;
              const isSelected = isFixed || !!selection;
              return (
                <OperationCheckbox
                  key={op.name}
                  nodeName={nodeName}
                  name={op.name}
                  description={op.description}
                  isSelected={isSelected}
                  disabled={isFixed}
                  requestFields={op.requestFields}
                  responseFields={op.responseFields}
                  selectedFields={selection?.fields ?? []}
                  requestParams={{
                    ...(selection?.requestParams ?? {}),
                    ...(isFixed ? fixedRequestParams : {})
                  }}
                  fixedRequestParams={isFixed ? fixedRequestParams : undefined}
                  fieldValues={selection?.fieldValues ?? {}}
                  onToggle={() => toggleOperation(op.name)}
                  onToggleField={(fieldName) => toggleField(op.name, fieldName)}
                  onSetRequestParam={(paramName, value) =>
                    setRequestParam(op.name, paramName, value)
                  }
                  onSetFieldValue={(fieldName, value) =>
                    setFieldValue(op.name, fieldName, value)
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function OperationCheckbox({
  nodeName,
  name,
  description,
  isSelected,
  disabled,
  requestFields,
  responseFields,
  selectedFields,
  requestParams,
  fixedRequestParams,
  fieldValues,
  onToggle,
  onToggleField,
  onSetRequestParam,
  onSetFieldValue
}: {
  nodeName: string;
  name: string;
  description: string;
  isSelected: boolean;
  disabled?: boolean;
  requestFields: NodeField[];
  responseFields: NodeField[];
  selectedFields: string[];
  requestParams: Record<string, string | string[]>;
  fixedRequestParams?: Record<string, string>;
  fieldValues: Record<string, string>;
  onToggle: () => void;
  onToggleField: (fieldName: string) => void;
  onSetRequestParam: (paramName: string, value: string | string[]) => void;
  onSetFieldValue: (fieldName: string, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(isSelected);
  const hasFields = requestFields.length > 0 || responseFields.length > 0;

  return (
    <div className="rounded-md border border-gray-100">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <input
          type="checkbox"
          checked={isSelected}
          disabled={disabled}
          onChange={() => {
            onToggle();
            setExpanded(!isSelected);
          }}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
        />
        <button
          onClick={() => isSelected && setExpanded(!expanded)}
          disabled={!isSelected}
          className="flex flex-1 items-center gap-1 text-left disabled:cursor-default"
        >
          {isSelected &&
            hasFields &&
            (expanded ? (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-400" />
            ))}
          <span className="text-xs font-medium text-gray-700">{name}</span>
        </button>
      </div>

      {isSelected && expanded && (
        <>
          {requestFields.length > 0 && (
            <div className="border-t border-gray-100 px-2.5 py-2">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Request Parameters
              </p>
              <div className="space-y-2">
                {requestFields.map((field) => (
                  <RequestFieldInput
                    key={field.name}
                    field={field}
                    isNexaDataSources={
                      nodeName === "nexa_chat" && field.name === "data_sources"
                    }
                    isNexaProject={
                      nodeName === "nexa_chat" && field.name === "project_id"
                    }
                    value={requestParams[field.name] ?? ""}
                    disabled={Object.hasOwn(
                      fixedRequestParams ?? {},
                      field.name
                    )}
                    onChange={(value) => onSetRequestParam(field.name, value)}
                  />
                ))}
              </div>
            </div>
          )}

          {responseFields.length > 0 && (
            <div className="border-t border-gray-100 px-2.5 py-2">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Response Fields
              </p>
              <div className="space-y-1.5">
                {responseFields.map((field) => {
                  const checked = selectedFields.includes(field.name);
                  return (
                    <div key={field.name} className="space-y-1">
                      <label className="flex items-center gap-2 py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleField(field.name)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-600">
                          {field.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {field.type}
                        </span>
                      </label>
                      {checked && (
                        <div className="pl-5">
                          <RequestFieldInput
                            field={field}
                            value={fieldValues[field.name] ?? ""}
                            onChange={(value) => {
                              if (typeof value === "string")
                                onSetFieldValue(field.name, value);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!hasFields && (
            <div className="border-t border-gray-100 px-2.5 py-2">
              <p className="text-[10px] text-gray-400">No fields</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RequestFieldInput({
  field,
  value,
  disabled,
  isNexaDataSources,
  isNexaProject,
  onChange
}: {
  field: NodeField;
  value: string | string[];
  disabled?: boolean;
  isNexaDataSources?: boolean;
  isNexaProject?: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const inputId = `req-${field.name}`;
  const label = field.description || field.name;
  const requiredMark = field.required ? " *" : "";
  const textValue = typeof value === "string" ? value : "";

  if (isNexaProject && field.type === "select") {
    return (
      <NexaProjectInput
        id={inputId}
        label={label}
        value={textValue}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (isNexaDataSources && field.type === "multiselect") {
    return (
      <ModuleDataSourcesInput
        id={inputId}
        label={label}
        value={parseNexaDataSources(value)}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="space-y-0.5">
        <label htmlFor={inputId} className="text-xs font-medium text-gray-700">
          {label}
          {requiredMark && <span className="text-red-500">{requiredMark}</span>}
          <span className="ml-1 text-[10px] text-gray-400">({field.type})</span>
        </label>
        <FormSelect
          id={inputId}
          value={textValue}
          onChange={onChange}
          disabled={disabled}
          size="sm"
          placeholder={`Not set${field.nullable ? " (nullable)" : ""}`}
          options={[
            { value: "true", label: "true" },
            { value: "false", label: "false" }
          ]}
        />
      </div>
    );
  }

  if (field.type === "array" || field.type === "object") {
    return (
      <div className="space-y-0.5">
        <label htmlFor={inputId} className="text-xs font-medium text-gray-700">
          {label}
          {requiredMark && <span className="text-red-500">{requiredMark}</span>}
          <span className="ml-1 text-[10px] text-gray-400">({field.type})</span>
        </label>
        <textarea
          id={inputId}
          value={textValue}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.type === "array" ? "[...]" : "{...}"}
          rows={2}
          className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50"
        />
      </div>
    );
  }

  const inputType =
    field.type === "integer" || field.type === "number" ? "number" : "text";

  return (
    <div className="space-y-0.5">
      <label htmlFor={inputId} className="text-xs font-medium text-gray-700">
        {label}
        {requiredMark && <span className="text-red-500">{requiredMark}</span>}
        <span className="ml-1 text-[10px] text-gray-400">({field.type})</span>
      </label>
      <input
        id={inputId}
        type={inputType}
        value={textValue}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          field.nullable ? "null" : field.type === "integer" ? "0" : ""
        }
        className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50"
      />
    </div>
  );
}

function NexaProjectInput({
  id,
  label,
  value,
  disabled,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const knowledgeApi = useKnowledgeApi();
  const {
    data: folders = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["synergy-intelligence", "projects"],
    queryFn: async () => extractFolders(await knowledgeApi.getFolders()),
    meta: { errorMessage: "Failed to load knowledge folders" }
  });
  const options = folders.map((folder) => ({
    value: folder.id,
    label: folder.title
  }));
  if (value && !options.some((folder) => folder.value === value))
    options.push({ value, label: `Unknown folder (${value})` });

  return (
    <div className="space-y-0.5">
      <label htmlFor={id} className="text-xs font-medium text-gray-700">
        {label} <span className="ml-1 text-[10px] text-gray-400">(select)</span>
      </label>
      <FormSelect
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        placeholder="No knowledge folder"
        disabled={disabled || isLoading}
        size="sm"
      />
      {isError && (
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs text-red-600"
        >
          Failed to load folders. Retry
        </button>
      )}
      {!isLoading && !isError && options.length === 0 && (
        <p className="text-xs text-gray-500">No knowledge folders available</p>
      )}
    </div>
  );
}

function ModuleDataSourcesInput({
  id,
  label,
  value,
  disabled,
  onChange
}: {
  id: string;
  label: string;
  value: string[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
}) {
  const { data, isLoading, isError, refetch } = useGetModules();
  const modules = data?.items ?? [];
  const options = [
    ...modules.filter((module) => module.id.trim()),
    ...value
      .filter((moduleId) => !modules.some((module) => module.id === moduleId))
      .map((moduleId) => ({ id: moduleId, name: moduleId, status: "unknown" }))
  ];
  const selectedNames = value.map(
    (moduleId) =>
      modules.find((module) => module.id === moduleId)?.name ?? moduleId
  );

  return (
    <div className="space-y-0.5">
      <label htmlFor={id} className="text-xs font-medium text-gray-700">
        {label}{" "}
        <span className="ml-1 text-[10px] text-gray-400">(multiselect)</span>
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-left text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50"
          >
            <span className="min-w-0 truncate">
              {selectedNames.length
                ? selectedNames.join(", ")
                : "Select data sources"}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-2"
        >
          {isLoading && (
            <p className="px-2 py-1 text-xs text-gray-500">
              Loading modules...
            </p>
          )}
          {isError && (
            <button
              type="button"
              onClick={() => refetch()}
              className="px-2 py-1 text-xs text-red-600"
            >
              Failed to load modules. Retry
            </button>
          )}
          {!isLoading && !isError && options.length === 0 && (
            <p className="px-2 py-1 text-xs text-gray-500">
              No modules available
            </p>
          )}
          <div className="max-h-52 space-y-1 overflow-y-auto">
            {options.map((module) => (
              <label
                key={module.id}
                className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={value.includes(module.id)}
                  onChange={() =>
                    onChange(
                      value.includes(module.id)
                        ? value.filter((id) => id !== module.id)
                        : [...value, module.id]
                    )
                  }
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="min-w-0 break-words">{module.name}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
