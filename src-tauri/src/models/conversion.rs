use serde::{Deserialize, Serialize};
use super::format::Format;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversionRequest {
    pub file_id: String,
    pub input_path: String,
    pub output_format: Format,
    pub output_path: Option<String>,
    pub quality: Option<u8>,
    pub batch_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversionResponse {
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub path: String,
    pub size: u64,
    pub detected_format: Option<Format>,
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversionProgress {
    pub file_id: String,
    pub progress: f32,
    pub status: ProgressStatus,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProgressStatus {
    Queued,
    Processing,
    Completed,
    Failed,
}
