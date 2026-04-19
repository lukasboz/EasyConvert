use super::traits::Converter;
use crate::models::{
    conversion::ConversionRequest,
    format::{DocumentFormat, Format},
};
use crate::utils::sidecar::{configure_command_no_window, get_sidecar_path};
use anyhow::{Context, Result};
use async_trait::async_trait;
use tokio::process::Command;

pub struct DocumentConverter;

impl DocumentConverter {
    pub fn new() -> Self {
        Self
    }

    fn all_formats() -> Vec<Format> {
        vec![
            Format::Document(DocumentFormat::PDF),
            Format::Document(DocumentFormat::DOCX),
            Format::Document(DocumentFormat::TXT),
            Format::Document(DocumentFormat::MD),
            Format::Document(DocumentFormat::HTML),
            Format::Document(DocumentFormat::RTF),
            Format::Document(DocumentFormat::EPUB),
            Format::Document(DocumentFormat::ODT),
            Format::Document(DocumentFormat::RST),
        ]
    }

    fn pandoc_name(format: &DocumentFormat) -> &'static str {
        match format {
            DocumentFormat::PDF => "pdf",
            DocumentFormat::DOCX => "docx",
            DocumentFormat::TXT => "plain",
            DocumentFormat::MD => "markdown",
            DocumentFormat::HTML => "html",
            DocumentFormat::RTF => "rtf",
            DocumentFormat::EPUB => "epub",
            DocumentFormat::ODT => "odt",
            DocumentFormat::RST => "rst",
        }
    }
}

#[async_trait]
impl Converter for DocumentConverter {
    fn supported_inputs(&self) -> Vec<Format> {
        Self::all_formats()
    }

    fn supported_outputs(&self) -> Vec<Format> {
        Self::all_formats()
    }

    fn can_convert(&self, from: &Format, to: &Format) -> bool {
        matches!(from, Format::Document(_)) && matches!(to, Format::Document(_))
    }

    async fn convert(
        &self,
        request: &ConversionRequest,
        progress_callback: Box<dyn Fn(f32) + Send + Sync>,
    ) -> Result<String> {
        progress_callback(0.05);

        let pandoc_path = get_sidecar_path("pandoc").context("Pandoc not found")?;

        let output_path = request
            .output_path
            .clone()
            .unwrap_or_else(|| self.generate_output_path(&request.input_path, &request.output_format));

        let input_format = match crate::utils::sidecar::detect_format_from_path(&request.input_path) {
            Some(Format::Document(fmt)) => Self::pandoc_name(&fmt),
            _ => anyhow::bail!("Could not detect input document format"),
        };

        let output_format = match &request.output_format {
            Format::Document(fmt) => Self::pandoc_name(fmt),
            _ => anyhow::bail!("Output format must be a document format"),
        };

        let mut cmd = Command::new(&pandoc_path);
        configure_command_no_window(&mut cmd);
        cmd.arg(&request.input_path);
        cmd.args(["-f", input_format]);
        cmd.args(["-t", output_format]);
        cmd.args(["-o", &output_path]);

        // --standalone is meaningful only for full-document targets, not plain/markdown fragments.
        if matches!(
            &request.output_format,
            Format::Document(
                DocumentFormat::HTML
                    | DocumentFormat::PDF
                    | DocumentFormat::DOCX
                    | DocumentFormat::RTF
                    | DocumentFormat::EPUB
                    | DocumentFormat::ODT
            )
        ) {
            cmd.arg("--standalone");
        }

        progress_callback(0.4);

        let output = cmd.output().await.context("Failed to execute Pandoc")?;

        if !output.status.success() {
            anyhow::bail!(
                "Pandoc conversion failed: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            );
        }

        progress_callback(1.0);
        Ok(output_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_convert_documents() {
        let converter = DocumentConverter::new();
        let from = Format::Document(DocumentFormat::MD);
        let to = Format::Document(DocumentFormat::PDF);
        assert!(converter.can_convert(&from, &to));
    }

    #[test]
    fn test_cannot_convert_non_documents() {
        let converter = DocumentConverter::new();
        let from = Format::Document(DocumentFormat::PDF);
        let to = Format::Image(crate::models::format::ImageFormat::PNG);
        assert!(!converter.can_convert(&from, &to));
    }
}
