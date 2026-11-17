"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useGetNodeTypeDetail, useGetNodeTypes } from "@/app/app/ai-studio/workflow/hooks/useNodeTypes";
import type { ConnectionParam } from "@/app/app/ai-studio/workflow/types";
import FormFieldLayout from "@/components/FormFieldLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONNECTION_ENVIRONMENTS, type ConnectionEnvironment, type ConnectionPayload, type MasterConnection } from "../types";
import { useCreateConnection, useMasterConnection, useUpdateConnection } from "../use-master-connections";

interface ConnectionDialogProps {
  open: boolean;
  connection: MasterConnection | null;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionDialog({ open, connection, onOpenChange }: ConnectionDialogProps) {
  const [nodeType, setNodeType] = useState(connection?.nodeType ?? "");
  const [environment, setEnvironment] = useState<ConnectionEnvironment>(connection?.environment ?? "development");
  const [values, setValues] = useState<Record<string, string>>(connection?.values ?? {});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const { data: nodeTypes, isLoading: loadingTypes } = useGetNodeTypes();
  const { data: detail, isLoading: loadingDetail } = useGetNodeTypeDetail(nodeType || undefined);
  const { data: savedConnection } = useMasterConnection(connection?.id ?? null);
  const create = useCreateConnection();
  const update = useUpdateConnection();
  const params = useMemo(() => detail?.connection_params ?? [], [detail]);
  const selectedConnector = nodeTypes?.items?.find((item) => item.connector_type === nodeType);
  const connectionName = detail?.name ?? selectedConnector?.name ?? connection?.name ?? nodeType;

  useEffect(() => {
    if (!savedConnection) return;
    const timer = setTimeout(() => setValues(savedConnection.values ?? {}), 0);
    return () => clearTimeout(timer);
  }, [savedConnection]);

  const canSave = Boolean(nodeType && connectionName) && params.every(
    (field: ConnectionParam) => !field.required || values[field.name]?.trim(),
  );
  const pending = create.isPending || update.isPending;

  async function save() {
    const payload: ConnectionPayload = {
      node_type: nodeType,
      name: connectionName,
      environment,
      values,
    };
    if (connection) await update.mutateAsync({ id: connection.id, payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{connection ? "Edit Connection" : "Add New Connection"}</DialogTitle>
          <DialogDescription className="sr-only">Configure an external service connection.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-3">
          <FormFieldLayout label="Select Connector" htmlFor="connection-node-type" required className="w-full">
            <Select
              value={nodeType}
              onValueChange={(value) => { setNodeType(value); setValues({}); }}
              disabled={Boolean(connection) || loadingTypes}
            >
              <SelectTrigger id="connection-node-type" className="w-full">
                <SelectValue placeholder="Select Connector" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes?.items?.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldLayout>

          <FormFieldLayout label="Environment" htmlFor="connection-environment" required className="w-full">
            <Select value={environment} onValueChange={(value) => setEnvironment(value as ConnectionEnvironment)}>
              <SelectTrigger id="connection-environment" className="w-full">
                <SelectValue placeholder="Select Environment" />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_ENVIRONMENTS.map((item) => (
                  <SelectItem key={item} value={item}>{title(item)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldLayout>

          {nodeType && (
            <div className="overflow-hidden rounded-lg border">
              <div className="border-b bg-neutral-50 px-4 py-3">
                <p className="text-sm font-semibold">Connection Fields</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Connection name: {connectionName || "Loading..."}
                </p>
              </div>
              <div className="space-y-4 p-4">
                {loadingDetail ? (
                  <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                ) : params.length === 0 ? (
                  <p className="text-sm text-muted-foreground">This connector has no credential fields.</p>
                ) : params.map((param: ConnectionParam) => (
                  <FormFieldLayout
                    key={param.name}
                    label={param.label || param.name}
                    htmlFor={`connection-${param.name}`}
                    required={param.required}
                    desc={param.description || undefined}
                    className="w-full"
                  >
                    <div className="relative">
                      <Input
                        id={`connection-${param.name}`}
                        type={param.secret && !visible[param.name] ? "password" : "text"}
                        value={values[param.name] ?? ""}
                        onChange={(event) => setValues((current) => ({ ...current, [param.name]: event.target.value }))}
                        placeholder={`Enter ${param.label || param.name}`}
                        className="h-10 w-full pr-10"
                      />
                      {param.secret && (
                        <button
                          type="button"
                          aria-label={`${visible[param.name] ? "Hide" : "Show"} ${param.label || param.name}`}
                          onClick={() => setVisible((current) => ({ ...current, [param.name]: !current[param.name] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {visible[param.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </FormFieldLayout>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || pending || loadingDetail} onClick={() => void save()}>
            {pending && <LoaderCircle className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function title(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
