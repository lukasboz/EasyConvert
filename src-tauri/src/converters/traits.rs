use crate::models::{conversion::ConversionRequest, format::Format};
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait Converter: Send + Sync {
    /// Returns the list of input formats this converter supports
    fn supported_inputs(&self) -> Vec<Format>;

    /// Returns the list of output formats this converter supports
    fn supported_outputs(&self) -> Vec<Format>;

    /// Checks if this converter can handle the conversion from one format to another
    fn can_convert(&self, from: &Format, to: &Format) -> bool;

    /// Performs the actual conversion
    /// The progress_callback is called with values from 0.0 to 1.0
    async fn convert(
        &self,
        request: &ConversionRequest,
        progress_callback: Box<dyn Fn(f32) + Send + Sync>,
    ) -> Result<String>;

    /// Generates an output path based on input path and output format
    fn generate_output_path(&self, input_path: &str, output_format: &Format) -> String {
        let path = std::path::Path::new(input_path);
        let stem = path.file_stem().unwrap_or_default().to_string_lossy();
        let parent = path.parent().unwrap_or(std::path::Path::new("."));
        let extension = output_format.to_extension();

        parent.join(format!("{}.{}", stem, extension)).to_string_lossy().to_string()
    }
}
