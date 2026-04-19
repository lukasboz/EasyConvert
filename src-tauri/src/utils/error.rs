use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum ConversionError {
    #[error("Unsupported format conversion: {from:?} to {to:?}")]
    UnsupportedConversion {
        from: String,
        to: String,
    },

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Conversion failed: {0}")]
    ConversionFailed(String),

    #[error("Invalid format: {0}")]
    InvalidFormat(String),

    #[error("Sidecar error: {0}")]
    SidecarError(String),

    #[error("IO error: {0}")]
    IoError(String),
}

impl From<std::io::Error> for ConversionError {
    fn from(err: std::io::Error) -> Self {
        ConversionError::IoError(err.to_string())
    }
}

impl From<ConversionError> for String {
    fn from(err: ConversionError) -> Self {
        err.to_string()
    }
}
