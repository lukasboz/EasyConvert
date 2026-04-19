import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDropZone, type FileDropZoneHandle } from "./components/FileDropZone";
import { FileList } from "./components/FileList";
import { BulkActions } from "./components/BulkActions";
import { ThemeToggle } from "./components/ThemeToggle";
import { FormatIcon } from "./components/FormatIcon";
import { useFileUpload } from "./hooks/useFileUpload";
import { useConversion } from "./hooks/useConversion";
import { useTheme } from "./hooks/useTheme";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { buildOutputPath } from "./utils/formatHelpers";
import type { Format } from "./types/conversion";

const PARALLEL_LIMIT = 4;

function App() {
  useTheme();
  const { files, addFiles, removeFile, updateFile, clearFiles, setFiles } = useFileUpload();
  const { convertFile, progressMap, clearProgress } = useConversion();
  const [isConverting, setIsConverting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(80);
  const toastTimer = useRef<number | null>(null);
  const filesRef = useRef(files);
  const dropzoneRef = useRef<FileDropZoneHandle | null>(null);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Sync progress events into file rows without keeping `files` in deps (avoids re-render loop).
  useEffect(() => {
    if (progressMap.size === 0) return;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.status !== "converting") return f;
        const p = progressMap.get(f.id);
        if (p === undefined || p === f.progress) return f;
        return { ...f, progress: p };
      })
    );
  }, [progressMap, setFiles]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const summary = useMemo(() => {
    const ready = files.filter((f) => f.outputFormat && f.status === "pending").length;
    const needsFormat = files.filter((f) => !f.outputFormat && f.status === "pending").length;
    const done = files.filter((f) => f.status === "completed").length;
    const failed = files.filter((f) => f.status === "error").length;
    return { ready, needsFormat, done, failed };
  }, [files]);

  const handleApplyFormatToAll = useCallback(
    (format: Format) => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== "pending") return f;
          if (!f.detectedFormat) return f;
          return { ...f, outputFormat: format };
        })
      );
    },
    [setFiles]
  );

  const handleConvertAll = useCallback(async () => {
    const queue = filesRef.current.filter((f) => f.outputFormat && f.status === "pending");
    if (queue.length === 0) {
      if (summary.needsFormat > 0) {
        showToast(`Pick output format for ${summary.needsFormat} file${summary.needsFormat === 1 ? "" : "s"}`);
      } else {
        showToast("Nothing to convert");
      }
      return;
    }

    setIsConverting(true);
    queue.forEach((f) => updateFile(f.id, { status: "converting", progress: 0, error: undefined }));

    let cursor = 0;
    const runOne = async () => {
      while (cursor < queue.length) {
        const idx = cursor++;
        const file = queue[idx];
        try {
          const res = await convertFile({
            fileId: file.id,
            inputPath: file.path,
            outputFormat: file.outputFormat!,
            outputPath: buildOutputPath(file.path, file.outputFormat!, outputDir),
            quality,
          });
          if (res.success) {
            updateFile(file.id, {
              status: "completed",
              progress: 1,
              outputPath: res.outputPath,
            });
          } else {
            updateFile(file.id, { status: "error", error: res.error || "Conversion failed" });
          }
        } catch (err) {
          updateFile(file.id, {
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          clearProgress(file.id);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(PARALLEL_LIMIT, queue.length) },
      () => runOne()
    );
    await Promise.all(workers);

    setIsConverting(false);
    const stillFailed = filesRef.current.filter((f) => f.status === "error").length;
    const newlyDone = queue.length - stillFailed;
    if (newlyDone > 0) {
      showToast(`Converted ${newlyDone} file${newlyDone === 1 ? "" : "s"}`);
    }
  }, [convertFile, updateFile, clearProgress, showToast, summary.needsFormat, outputDir, quality]);

  const handleClear = useCallback(() => {
    if (isConverting) return;
    clearFiles();
  }, [isConverting, clearFiles]);

  useKeyboardShortcuts({
    onOpen: () => dropzoneRef.current?.openPicker(),
    onConvert: () => {
      if (!isConverting && summary.ready > 0) handleConvertAll();
    },
    onClear: () => {
      if (!isConverting && filesRef.current.length > 0) handleClear();
    },
    onHelp: () => showToast("Ctrl+O open · Ctrl+Enter convert · Esc clear"),
  });

  const cta = isConverting
    ? "Converting…"
    : summary.ready > 0
      ? `Convert ${summary.ready}`
      : "Convert";

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-brand">
          <div className="masthead-mark">
            Easy<em>Convert</em>
          </div>
          <div className="masthead-tag">A local file converter</div>
        </div>
        <div className="masthead-right">
          <div className="masthead-meta">
            {files.length > 0 ? (
              <>
                <strong>{files.length}</strong> queued ·{" "}
                <strong>{summary.done}</strong> done
              </>
            ) : (
              <>Drag · Drop · Pick</>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="main">
        <FileDropZone ref={dropzoneRef} onFilesAdded={addFiles} />

        {files.length > 0 && (
          <BulkActions
            files={files}
            isConverting={isConverting}
            outputDir={outputDir}
            onOutputDirChange={setOutputDir}
            quality={quality}
            onQualityChange={setQuality}
            onApplyFormatToAll={handleApplyFormatToAll}
          />
        )}

        <FileList
          files={files}
          onRemove={removeFile}
          onFormatChange={(id, format) => updateFile(id, { outputFormat: format })}
          isConverting={isConverting}
        />

        {files.length > 0 && (
          <div className="actions">
            <div
              className="actions-info"
              data-tone={summary.needsFormat > 0 ? "warn" : undefined}
            >
              {summary.needsFormat > 0
                ? `${summary.needsFormat} awaiting output format`
                : summary.ready > 0
                  ? `${summary.ready} ready to convert`
                  : isConverting
                    ? "Working in parallel…"
                    : "All done"}
            </div>
            <div className="actions-buttons">
              <button
                type="button"
                className="btn"
                onClick={handleClear}
                disabled={isConverting}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConvertAll}
                disabled={isConverting || summary.ready === 0}
              >
                {isConverting && <span className="btn-spinner" aria-hidden="true" />}
                {cta}
              </button>
            </div>
          </div>
        )}

        {files.length === 0 && (
          <div className="empty">
            <div className="empty-label">Supported<br />formats</div>
            <dl className="empty-categories">
              <div className="empty-cat">
                <dt><FormatIcon category="Image" /> Images</dt>
                <dd>JPG · PNG · WebP · GIF<br />BMP · TIFF · HEIC<br />SVG · ICO</dd>
              </div>
              <div className="empty-cat">
                <dt><FormatIcon category="Video" /> Video</dt>
                <dd>MP4 · MKV · WebM · MOV<br />AVI · FLV · 3GP<br />M4V · TS · WMV</dd>
              </div>
              <div className="empty-cat">
                <dt><FormatIcon category="Audio" /> Audio</dt>
                <dd>MP3 · WAV · FLAC · AAC<br />OGG · M4A · OPUS<br />WMA · ALAC</dd>
              </div>
              <div className="empty-cat">
                <dt><FormatIcon category="Document" /> Documents</dt>
                <dd>PDF · DOCX · MD · HTML<br />TXT · RTF · EPUB<br />ODT · RST</dd>
              </div>
              <div className="empty-cat">
                <dt><FormatIcon category="Archive" /> Archives</dt>
                <dd>ZIP · 7Z · TAR<br />GZ · BZ2 · XZ</dd>
              </div>
            </dl>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Runs locally · No upload</span>
        <span>v0.2 · ? for shortcuts</span>
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;
