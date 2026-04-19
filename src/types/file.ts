import { Format } from "./conversion";

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  detectedFormat?: Format;
  outputFormat?: Format;
  progress: number;
  status: "pending" | "converting" | "completed" | "error";
  error?: string;
  outputPath?: string;
}
