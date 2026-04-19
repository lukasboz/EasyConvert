import { memo } from "react";
import type { FileItem } from "../types/file";
import type { Format } from "../types/conversion";
import { FormatSelector } from "./FormatSelector";
import { FormatIcon } from "./FormatIcon";
import { getFormatLabel } from "../utils/formatHelpers";

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: Format) => void;
  isConverting: boolean;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)} ${units[i]}`;
}

const statusLabel: Record<FileItem["status"], string> = {
  pending: "Ready",
  converting: "Working",
  completed: "Done",
  error: "Failed",
};

export const FileList = memo(function FileList({
  files,
  onRemove,
  onFormatChange,
  isConverting,
}: FileListProps) {
  if (files.length === 0) return null;

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const completed = files.filter((f) => f.status === "completed").length;

  return (
    <section className="list" aria-label="Queued files">
      <header className="list-head">
        <h2>
          Queue <span className="count">— {files.length} {files.length === 1 ? "file" : "files"}</span>
        </h2>
        <div className="list-head-meta">
          <span><strong>{formatBytes(totalBytes)}</strong> total</span>
          <span><strong>{completed}</strong> done</span>
        </div>
      </header>

      {files.map((file) => (
        <Row
          key={file.id}
          file={file}
          onRemove={onRemove}
          onFormatChange={onFormatChange}
          isConverting={isConverting}
        />
      ))}
    </section>
  );
});

interface RowProps {
  file: FileItem;
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: Format) => void;
  isConverting: boolean;
}

const Row = memo(function Row({ file, onRemove, onFormatChange, isConverting }: RowProps) {
  const pct = Math.max(0, Math.min(100, Math.round(file.progress * 100)));

  return (
    <article className="row" data-status={file.status}>
      <div className="row-main">
        <div className="row-name" title={file.path}>
          {file.name}
        </div>
        <div className="row-meta">
          <span>{formatBytes(file.size)}</span>
          {file.detectedFormat && (
            <span className="badge">
              <FormatIcon category={file.detectedFormat.type} />
              {getFormatLabel(file.detectedFormat)}
            </span>
          )}
          {!file.detectedFormat && <span className="badge">Unknown type</span>}
        </div>
        {file.status === "error" && file.error && (
          <div className="row-error" title={file.error}>
            ✕ {file.error}
          </div>
        )}
      </div>

      <FormatSelector
        currentFormat={file.detectedFormat}
        selectedFormat={file.outputFormat}
        onChange={(format) => onFormatChange(file.id, format)}
        disabled={isConverting && file.status !== "pending"}
      />

      <div className="row-status" data-state={file.status}>
        {file.status === "converting" ? (
          <>
            <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            <span className="bar-pct">{pct}%</span>
          </>
        ) : (
          <span className="row-status-label">
            {file.status === "completed" && "✓ "}
            {file.status === "error" && "✕ "}
            {statusLabel[file.status]}
          </span>
        )}
      </div>

      <button
        type="button"
        className="row-remove"
        onClick={() => onRemove(file.id)}
        disabled={file.status === "converting"}
        aria-label={`Remove ${file.name}`}
        title="Remove"
      >
        ×
      </button>
    </article>
  );
});
