"use client";

import { useState } from "react";
import Table from "@/components/Table";
import type { TableColumn } from "@/types/type";
import type { ListPage, Params } from "../api-types";
import { useCapacityQuery } from "../use-capacity";
import { ApiState } from "./ApiState";

interface Props<T> {
  title: string;
  path: string;
  params?: Params;
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  toolbarActions?: React.ReactNode;
  statusOptions?: { label: string; value: string }[];
  defaultPageSize?: number;
}

export function ApiTable<T>(props: Props<T>) {
  // Changing any external filter resets the cursor chain.
  return <CursorTable key={JSON.stringify([props.path, props.params])} {...props} />;
}

function CursorTable<T>({ title, path, params, columns, getRowId, toolbarActions, statusOptions, defaultPageSize = 20 }: Props<T>) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);
  const [tokens, setTokens] = useState<string[]>([""]);
  const query = useCapacityQuery<ListPage<T>>(path, {
    ...params, page_size: pageSize, page_token: tokens[page - 1], search: search || undefined,
    ...(status !== "all" ? { status } : {}),
  });
  const reset = () => { setPage(1); setTokens([""]); };
  return (
    <section className="space-y-4 rounded-xl border border-border bg-background p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ApiState query={query} />
      <Table
        columns={columns} data={query.data?.items ?? []} getRowId={getRowId}
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); reset(); }}
        toolbarActions={toolbarActions}
        toolbarLayout="horizontal"
        filters={statusOptions ? [{
          key: "status", placeholder: "Status", value: status,
          options: [{ label: "All Statuses", value: "all" }, ...statusOptions],
          onChange: (value) => { setStatus(value); reset(); },
        }] : undefined}
        emptyState={{ description: query.isPending ? "Loading..." : query.error ? "Unable to load records." : "No records found." }}
        pagination={{
          page, pageSize, totalEntries: query.data?.total_count ?? 0,
          pageSizeOptions: [5, 10, 20, 50, 100],
          onPageSizeChange: (value) => { setPageSize(value); reset(); },
          canPageChange: (next) => !query.isFetching && (next <= page || (next === page + 1 && !!query.data?.next_page_token)),
          onPageChange: (next) => {
            if (next === page + 1 && query.data?.next_page_token) {
              setTokens((old) => [...old.slice(0, page), query.data!.next_page_token!]);
            }
            setPage(next);
          },
        }}
      />
    </section>
  );
}
