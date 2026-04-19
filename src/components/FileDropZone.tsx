import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";

interface FileDropZoneProps {
  onFilesAdded: (paths: string[]) => void;
}

export interface FileDropZoneHandle {
  openPicker: () => Promise<void>;
}

type DragDropPayload =
  | { type: "enter" | "over" | "drop"; paths?: string[]; position?: { x: number; y: number } }
  | { type: "leave" }
  | string[];

export const FileDropZone = forwardRef<FileDropZoneHandle, FileDropZoneProps>(
  function FileDropZone({ onFilesAdded }, ref) {
    const [isDragging, setIsDragging] = useState(false);
    const onFilesRef = useRef(onFilesAdded);

    useEffect(() => {
      onFilesRef.current = onFilesAdded;
    }, [onFilesAdded]);

    useEffect(() => {
      let unsubs: UnlistenFn[] = [];
      let cancelled = false;

      const handlePaths = (paths: string[] | undefined) => {
        if (paths && paths.length > 0) onFilesRef.current(paths);
        setIsDragging(false);
      };

      const setup = async () => {
        const eventNames = [
          "tauri://drag-drop",
          "tauri://drag-enter",
          "tauri://drag-over",
          "tauri://drag-leave",
          "tauri://file-drop",
          "tauri://file-drop-hover",
          "tauri://file-drop-cancelled",
        ];

        for (const name of eventNames) {
          try {
            const un = await listen<DragDropPayload>(name, (event) => {
              const payload = event.payload as DragDropPayload;
              if (name.endsWith("drop") || name === "tauri://file-drop") {
                if (Array.isArray(payload)) handlePaths(payload);
                else if (payload && "paths" in payload) handlePaths(payload.paths);
                else setIsDragging(false);
              } else if (name.includes("leave") || name.includes("cancelled")) {
                setIsDragging(false);
              } else {
                setIsDragging(true);
              }
            });
            if (cancelled) un();
            else unsubs.push(un);
          } catch {
            // event not available in this runtime; skip silently
          }
        }
      };

      setup();

      return () => {
        cancelled = true;
        unsubs.forEach((u) => u());
      };
    }, []);

    const handlePick = useCallback(async () => {
      try {
        const selected = await open({ multiple: true, directory: false });
        if (!selected) return;
        const paths = Array.isArray(selected) ? selected : [selected];
        if (paths.length > 0) onFilesRef.current(paths);
      } catch (err) {
        console.error("file picker failed:", err);
      }
    }, []);

    useImperativeHandle(ref, () => ({ openPicker: handlePick }), [handlePick]);

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePick();
        }
      },
      [handlePick]
    );

    return (
      <div
        className="dropzone"
        data-dragging={isDragging}
        onClick={handlePick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Add files"
      >
        <span className="dropzone-glyph" aria-hidden="true">
          ƒ
        </span>
        <div className="dropzone-body">
          <span className="dropzone-title">
            {isDragging ? "Release to add files" : "Drop files anywhere on this page"}
          </span>
          <span className="dropzone-sub">
            or use the picker · multiple files supported
          </span>
        </div>
        <span className="dropzone-cta">Browse</span>
      </div>
    );
  }
);
