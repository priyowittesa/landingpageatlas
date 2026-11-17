"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeSearchInput } from "./knowledge-search-input";

interface KnowledgeToolbarProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onUpload: () => void;
}

export function KnowledgeToolbar({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onUpload,
}: KnowledgeToolbarProps) {
  return (
    <div className="flex w-full gap-3 md:w-auto md:items-end">
      <Button className="h-10 w-full sm:w-auto" onClick={onUpload}>
        <Upload className="h-4 w-4" />
        Upload File
      </Button>
      <KnowledgeSearchInput
        value={search}
        onChange={onSearchChange}
        ariaLabel="Search uploaded files"
        className="w-full sm:min-w-64 md:w-72"
      />
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter upload status"
        className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
      >
        <option value="all">All Status</option>
        <option value="uploaded">Uploaded</option>
        <option value="chunking">Chunking</option>
        <option value="ready">Ready</option>
        <option value="failed">Failed</option>
      </select>
    </div>
  );
}
