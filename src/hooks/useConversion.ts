import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConversionRequest,
  ConversionResponse,
  Format,
} from "../types/conversion";

// Module-level format cache shared across components.
const supportedOutputCache = new Map<string, Promise<Format[]>>();

export function useConversion() {
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const pendingUpdates = useRef<Map<string, number>>(new Map());
  const flushHandle = useRef<number | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    listen<[string, number]>("conversion-progress", (event) => {
      const [fileId, progress] = event.payload;
      pendingUpdates.current.set(fileId, progress);

      // Coalesce updates per animation frame.
      if (flushHandle.current === null) {
        flushHandle.current = window.requestAnimationFrame(() => {
          flushHandle.current = null;
          if (pendingUpdates.current.size === 0) return;
          const updates = pendingUpdates.current;
          pendingUpdates.current = new Map();
          setProgressMap((prev) => {
            const next = new Map(prev);
            updates.forEach((v, k) => next.set(k, v));
            return next;
          });
        });
      }
    }).then((un) => {
      if (cancelled) un();
      else unlisten = un;
    });

    return () => {
      cancelled = true;
      unlisten?.();
      if (flushHandle.current !== null) {
        window.cancelAnimationFrame(flushHandle.current);
        flushHandle.current = null;
      }
    };
  }, []);

  const convertFile = useCallback(
    (request: ConversionRequest): Promise<ConversionResponse> =>
      invoke<ConversionResponse>("convert_file", { request }),
    []
  );

  const batchConvert = useCallback(
    (requests: ConversionRequest[]): Promise<ConversionResponse[]> =>
      invoke<ConversionResponse[]>("batch_convert", { requests }),
    []
  );

  const validateConversion = useCallback(
    async (inputFormat: Format, outputFormat: Format): Promise<boolean> => {
      try {
        return await invoke<boolean>("validate_conversion", {
          inputFormat,
          outputFormat,
        });
      } catch {
        return false;
      }
    },
    []
  );

  const getSupportedOutputs = useCallback(
    (inputFormat: Format): Promise<Format[]> => {
      const key = `${inputFormat.type}:${inputFormat.value}`;
      const cached = supportedOutputCache.get(key);
      if (cached) return cached;
      const promise = invoke<Format[]>("get_supported_outputs", { inputFormat }).catch(
        () => [] as Format[]
      );
      supportedOutputCache.set(key, promise);
      return promise;
    },
    []
  );

  const clearProgress = useCallback((fileId: string) => {
    setProgressMap((prev) => {
      if (!prev.has(fileId)) return prev;
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  return {
    convertFile,
    batchConvert,
    validateConversion,
    getSupportedOutputs,
    progressMap,
    clearProgress,
  };
}
