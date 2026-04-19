import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { FileItem } from "../types/file";
import type { FileInfo } from "../types/conversion";

export function useFileUpload() {
  const [files, setFiles] = useState<FileItem[]>([]);
  // Mirror of `files` for synchronous reads inside callbacks.
  const filesRef = useRef<FileItem[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const addFiles = useCallback(async (filePaths: string[]) => {
    if (!filePaths || filePaths.length === 0) return;

    const known = new Set(filesRef.current.map((f) => f.path));
    const fresh: string[] = [];
    const seen = new Set<string>();
    for (const p of filePaths) {
      if (known.has(p) || seen.has(p)) continue;
      seen.add(p);
      fresh.push(p);
    }
    if (fresh.length === 0) return;

    const placeholders: FileItem[] = fresh.map((path) => ({
      id: crypto.randomUUID(),
      name: path.split(/[\\/]/).pop() || path,
      path,
      size: 0,
      progress: 0,
      status: "pending",
    }));

    filesRef.current = [...filesRef.current, ...placeholders];
    setFiles(filesRef.current);

    // Resolve metadata in parallel; patch each row when its info arrives.
    await Promise.all(
      placeholders.map(async (item) => {
        try {
          const info = await invoke<FileInfo>("get_file_info", { path: item.path });
          setFiles((cur) =>
            cur.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    size: info.size,
                    detectedFormat: info.detectedFormat,
                    status: info.detectedFormat ? "pending" : "error",
                    error: info.detectedFormat ? undefined : "Unsupported file type",
                  }
                : f
            )
          );
        } catch (err) {
          setFiles((cur) =>
            cur.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    status: "error",
                    error: typeof err === "string" ? err : "Failed to read file",
                  }
                : f
            )
          );
        }
      })
    );
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<FileItem>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    updateFile,
    clearFiles,
    setFiles,
  };
}
