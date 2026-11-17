"use client";

import FileViewer, { type FileViewerProps } from "@file-viewer/react";
import { imageRenderer } from "@file-viewer/renderer-image";
import { pdfRenderer } from "@file-viewer/renderer-pdf";
import { presentationRenderer } from "@file-viewer/renderer-presentation";
import { spreadsheetRenderer } from "@file-viewer/renderer-spreadsheet";
import { textRenderer } from "@file-viewer/renderer-text";
import { wordRenderer } from "@file-viewer/renderer-word";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { getChatFileProxyUrl } from "./useChatFileDownload";

type FileViewerOptions = NonNullable<FileViewerProps["options"]>;
// Hand-picked instead of @file-viewer/preset-office, which also bundles
// OFD, iWork, WordPerfect and Hangul renderers (~80 MB of dev chunks).
const OFFICE_PRESET = {
  id: "atlas-office",
  label: "ATLAS office renderers",
  renderers: [
    pdfRenderer,
    wordRenderer,
    spreadsheetRenderer,
    presentationRenderer
  ]
} as unknown as FileViewerOptions["preset"];
const PREVIEW_RENDERERS = [
  imageRenderer,
  textRenderer
] as unknown as FileViewerOptions["renderers"];

export interface OfficeFilePreview {
  fileId: string;
  displayName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export function OfficeFilePreviewPane({
  file,
  className = ""
}: {
  file: OfficeFilePreview;
  className?: string;
}) {
  return (
    <div
      className={`min-h-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${className}`}
    >
      <FileViewer
        key={`${file.fileId}-${file.fileUrl}`}
        url={getChatFileProxyUrl(file.fileUrl, file.fileName)}
        filename={file.fileName}
        type={file.fileType}
        className="h-full min-h-0 w-full"
        options={{
          preset: OFFICE_PRESET,
          renderers: PREVIEW_RENDERERS,
          rendererMode: "replace",
          theme: "light",
          styleIsolation: "shadow",
          toolbar: {
            position: "bottom-right",
            download: false,
            print: true,
            search: true,
            zoom: true
          }
        }}
      />
    </div>
  );
}

export function OfficeFilePreviewDialog({
  file,
  onOpenChange
}: {
  file: OfficeFilePreview | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] max-h-[90vh] grid-rows-[auto_minmax(0,1fr)] gap-3 p-4 sm:max-w-[min(96vw,1200px)]">
        <DialogHeader className="min-w-0 pr-8">
          <DialogTitle className="truncate text-base">
            {file?.displayName ?? "File preview"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preview of {file?.displayName ?? "the selected file"}
          </DialogDescription>
        </DialogHeader>
        {file && <OfficeFilePreviewPane file={file} className="h-full" />}
      </DialogContent>
    </Dialog>
  );
}
