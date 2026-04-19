import { useEffect, useRef, useState } from "react";
import type { Format } from "../types/conversion";
import { formatToString, getFormatLabel } from "../utils/formatHelpers";
import { useConversion } from "../hooks/useConversion";

interface FormatSelectorProps {
  currentFormat?: Format;
  selectedFormat?: Format;
  onChange: (format: Format) => void;
  disabled?: boolean;
}

const cache = new Map<string, Promise<Format[]>>();

export function FormatSelector({
  currentFormat,
  selectedFormat,
  onChange,
  disabled,
}: FormatSelectorProps) {
  const { getSupportedOutputs } = useConversion();
  const [formats, setFormats] = useState<Format[]>([]);
  const reqId = useRef(0);

  useEffect(() => {
    if (!currentFormat) {
      setFormats([]);
      return;
    }
    const key = formatToString(currentFormat);
    let promise = cache.get(key);
    if (!promise) {
      promise = getSupportedOutputs(currentFormat);
      cache.set(key, promise);
    }
    const id = ++reqId.current;
    promise
      .then((list) => {
        if (id === reqId.current) setFormats(list);
      })
      .catch(() => {
        if (id === reqId.current) setFormats([]);
      });
  }, [currentFormat, getSupportedOutputs]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (!v) return;
    const [type, value] = v.split(":");
    if (type && value) onChange({ type, value } as Format);
  };

  const grouped = groupFormats(formats);
  const isDisabled = disabled || !currentFormat || formats.length === 0;

  return (
    <label className="select">
      <select
        value={selectedFormat ? formatToString(selectedFormat) : ""}
        onChange={handleChange}
        disabled={isDisabled}
        aria-label="Output format"
      >
        <option value="" disabled>
          {currentFormat ? "Convert to…" : "Unknown format"}
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
