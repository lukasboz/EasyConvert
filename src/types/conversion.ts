export enum ImageFormat {
  JPG = "JPG",
  JPEG = "JPEG",
  PNG = "PNG",
  WEBP = "WEBP",
  GIF = "GIF",
  BMP = "BMP",
  TIFF = "TIFF",
  HEIC = "HEIC",
  SVG = "SVG",
  ICO = "ICO",
}

export enum VideoFormat {
  MP4 = "MP4",
  MKV = "MKV",
  WEBM = "WEBM",
  MOV = "MOV",
  AVI = "AVI",
  FLV = "FLV",
  THREEGP = "3GP",
  M4V = "M4V",
  TS = "TS",
  WMV = "WMV",
}

export enum AudioFormat {
  MP3 = "MP3",
  WAV = "WAV",
  FLAC = "FLAC",
  AAC = "AAC",
  OGG = "OGG",
  M4A = "M4A",
  OPUS = "OPUS",
  WMA = "WMA",
  ALAC = "ALAC",
}

export enum DocumentFormat {
  PDF = "PDF",
  DOCX = "DOCX",
  TXT = "TXT",
  MD = "MD",
  HTML = "HTML",
  RTF = "RTF",
  EPUB = "EPUB",
  ODT = "ODT",
  RST = "RST",
}

export enum ArchiveFormat {
  ZIP = "ZIP",
  SEVENZ = "7Z",
  TAR = "TAR",
  RAR = "RAR",
  GZ = "GZ",
  BZIP2 = "BZIP2",
  XZ = "XZ",
}

export type Format =
  | { type: "Image"; value: ImageFormat }
  | { type: "Video"; value: VideoFormat }
  | { type: "Audio"; value: AudioFormat }
  | { type: "Document"; value: DocumentFormat }
  | { type: "Archive"; value: ArchiveFormat };

export interface ConversionRequest {
  fileId: string;
  inputPath: string;
  outputFormat: Format;
  outputPath?: string;
  quality?: number;
  batchId?: string;
}

export interface ConversionResponse {
  success: boolean;
  outputPath?: string;
  error?: string;
  durationMs: number;
}

export interface FileInfo {
  path: string;
  size: number;
  detectedFormat?: Format;
  mimeType?: string;
}

export interface ConversionProgress {
  fileId: string;
  progress: number;
  status: "queued" | "processing" | "completed" | "failed";
  message?: string;
}
