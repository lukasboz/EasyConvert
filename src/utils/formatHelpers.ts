import {
  ArchiveFormat,
  AudioFormat,
  DocumentFormat,
  Format,
  ImageFormat,
  VideoFormat,
} from "../types/conversion";

export function formatToString(format: Format): string {
  return `${format.type}:${format.value}`;
}

export function stringToFormat(str: string): Format | null {
  const [type, value] = str.split(":");
  if (!type || !value) return null;
  return { type, value } as Format;
}

export function getFormatLabel(format: Format): string {
  return format.value;
}

export function getFormatGroup(format: Format): string {
  return format.type;
}

export function getCategoryFromFormat(format: Format): Format["type"] {
  return format.type;
}

const IMAGE_EXT: Record<ImageFormat, string> = {
  [ImageFormat.JPG]: "jpg",
  [ImageFormat.JPEG]: "jpg",
  [ImageFormat.PNG]: "png",
  [ImageFormat.WEBP]: "webp",
  [ImageFormat.GIF]: "gif",
  [ImageFormat.BMP]: "bmp",
  [ImageFormat.TIFF]: "tiff",
  [ImageFormat.HEIC]: "heic",
  [ImageFormat.SVG]: "svg",
  [ImageFormat.ICO]: "ico",
};

const VIDEO_EXT: Record<VideoFormat, string> = {
  [VideoFormat.MP4]: "mp4",
  [VideoFormat.MKV]: "mkv",
  [VideoFormat.WEBM]: "webm",
  [VideoFormat.MOV]: "mov",
  [VideoFormat.AVI]: "avi",
  [VideoFormat.FLV]: "flv",
  [VideoFormat.THREEGP]: "3gp",
  [VideoFormat.M4V]: "m4v",
  [VideoFormat.TS]: "ts",
  [VideoFormat.WMV]: "wmv",
};

const AUDIO_EXT: Record<AudioFormat, string> = {
  [AudioFormat.MP3]: "mp3",
  [AudioFormat.WAV]: "wav",
  [AudioFormat.FLAC]: "flac",
  [AudioFormat.AAC]: "aac",
  [AudioFormat.OGG]: "ogg",
  [AudioFormat.M4A]: "m4a",
  [AudioFormat.OPUS]: "opus",
  [AudioFormat.WMA]: "wma",
  [AudioFormat.ALAC]: "caf",
};

const DOC_EXT: Record<DocumentFormat, string> = {
  [DocumentFormat.PDF]: "pdf",
  [DocumentFormat.DOCX]: "docx",
  [DocumentFormat.TXT]: "txt",
  [DocumentFormat.MD]: "md",
  [DocumentFormat.HTML]: "html",
  [DocumentFormat.RTF]: "rtf",
  [DocumentFormat.EPUB]: "epub",
  [DocumentFormat.ODT]: "odt",
  [DocumentFormat.RST]: "rst",
};

const ARCHIVE_EXT: Record<ArchiveFormat, string> = {
  [ArchiveFormat.ZIP]: "zip",
  [ArchiveFormat.SEVENZ]: "7z",
  [ArchiveFormat.TAR]: "tar",
  [ArchiveFormat.RAR]: "rar",
  [ArchiveFormat.GZ]: "gz",
  [ArchiveFormat.BZIP2]: "bz2",
  [ArchiveFormat.XZ]: "xz",
};

export function getDisplayExtension(format: Format): string {
  switch (format.type) {
    case "Image":
      return IMAGE_EXT[format.value];
    case "Video":
      return VIDEO_EXT[format.value];
    case "Audio":
      return AUDIO_EXT[format.value];
    case "Document":
      return DOC_EXT[format.value];
    case "Archive":
      return ARCHIVE_EXT[format.value];
  }
}

/**
 * Build an output path: outputDir + basename(inputPath, no ext) + . + new ext.
 * If outputDir is null, returns null (let the backend pick "next to source").
 */
export function buildOutputPath(
  inputPath: string,
  outputFormat: Format,
  outputDir: string | null
): string | undefined {
  if (!outputDir) return undefined;
  const sep = inputPath.includes("\\") ? "\\" : "/";
  const filename = inputPath.split(/[\\/]/).pop() || inputPath;
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = getDisplayExtension(outputFormat);
  const dir = outputDir.replace(/[\\/]+$/, "");
  return `${dir}${sep}${stem}.${ext}`;
}

export function intersectFormats(lists: Format[][]): Format[] {
  if (lists.length === 0) return [];
  const [first, ...rest] = lists;
  if (rest.length === 0) return [...first];
  const keep = new Map<string, Format>();
  for (const f of first) keep.set(formatToString(f), f);
  for (const list of rest) {
    const seen = new Set(list.map(formatToString));
    for (const k of [...keep.keys()]) {
      if (!seen.has(k)) keep.delete(k);
    }
  }
  return [...keep.values()];
}
