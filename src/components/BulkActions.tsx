import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { Format } from "../types/conversion";
import type { FileItem } from "../types/file";
import { useConversion } from "../hooks/useConversion";
import {
  formatToString,
  getFormatLabel,
  intersectFormats,
} from "../utils/formatHelpers";
import { QualitySlider } from "./QualitySlider";

interface Props {
  files: FileItem[];
  isConverting: boolean;
  outputDir: string | null;
  onOutputDirChange: (dir: string | null) => void;
  quality: number;
  onQualityChange: (q: number) => void;
  onApplyFormatToAll: (format: Format) => void;
}

export function BulkActions({
  files,
  isConverting,
  outputDir,
  onOutputDirChange,
  quality,
  onQualityChange,
  onApplyFormatToAll,
}: Props) {
  const { getSupportedOutputs } = useConversion();
  const [common, setCommon] = useState<Format[]>([]);
  const [pickedFormat, setPickedFormat] = useState<string>("");

  const inputKeys = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) {
      if (f.detectedFormat) set.add(formatToString(f.detectedFormat));
    }
    return [...set].sort();
  }, [files]);

  useEffect(() => {
    let cancelled = false;
    if (inputKeys.length === 0) {
      setCommon([]);
      return;
    }
    (async () => {
      const formats = files
        .map((f) => f.detectedFormat)
        .filter((f): f is Format => Boolean(f));
      const seen = new Set<string>();
      const unique = formats.filter((f) => {
        const k = formatToString(f);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      const lists = await Promise.all(unique.map((f) => getSupportedOutputs(f)));
      if (!cancelled) setCommon(intersectFormats(lists));
    })();
    return () => {
      cancelled = true;
    };
  }, [inputKeys.join("|"), getSupportedOutputs]);

  const grouped = useMemo(() => groupFormats(common), [common]);

  const handleApply = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setPickedFormat(v);
    if (!v) return;
    const [type, value] = v.split(":");
    if (type && value) {
      onApplyFormatToAll({ type, value } as Format);
    }
  };

  const handlePickFolder = async () => {
    try {
      const dir = await open({ directory: true, multiple: false });
      if (typeof dir === "string") onOutputDirChange(dir);
    } catch (err) {
      console.error("folder picker failed:", err);
    }
  };

  const folderLabel = outputDir
    ? truncateMiddle(outputDir, 36)
    : "Save next to source";

  return (
    <section className="bulk" aria-label="Bulk options">
      <div className="bulk-row">
        <div className="bulk-cell">
          <span className="bulk-label">Apply to all</span>
          <label className="select bulk-select">
            <select
              value={pickedFormat}
              onChange={handleApply}
              disabled={isConverting || common.length === 0}
              aria-label="Apply output format to all files"
            >
              <option value="" disabled>
                {common.length === 0 ? "No common output" : "Pick format…"}
              </option>
              {grouped.map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((fmt) => (
                    <option key={formatToString(fmt)} value={formatToString(fmt)}>
                      {getFormatLabel(fmt)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <div className="bulk-cell">
          <span className="bulk-label">Output folder</span>
          <div className="bulk-folder">
            <button
              type="button"
              className="bulk-folder-btn"
              onClick={handlePickFolder}
              disabled={isConverting}
              title={outputDir ?? "Pick output folder"}
            >
              {folderLabel}
            </button>
            {outputDir && (
              <button
                type="button"
                className="bulk-folder-clear"
                onClick={() => onOutputDirChange(null)}
                disabled={isConverting}
                aria-label="Clear output folder"
                title="Reset to source directory"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="bulk-cell bulk-cell-quality">
          <QualitySlider
            value={quality}
            onChange={onQualityChange}
            disabled={isConverting}
          />
        </div>
      </div>
    </section>
  );
}

function groupFormats(formats: Format[]): Array<[string, Format[]]> {
  const order = ["Image", "Video", "Audio", "Document", "Archive"];
  const map = new Map<string, Format[]>();
  for (const f of formats) {
    if (!map.has(f.type)) map.set(f.type, []);
    map.get(f.type)!.push(f);
  }
  for (const [, items] of map) {
    items.sort((a, b) => a.value.localeCompare(b.value));
  }
  return order
    .filter((g) => map.has(g))
    .map((g) => [g, map.get(g)!] as [string, Format[]]);
}

function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  const keep = Math.floor((max - 1) / 2);
  return `${s.slice(0, keep)}…${s.slice(s.length - keep)}`;
}
