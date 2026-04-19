use super::traits::Converter;
use crate::models::{
    conversion::ConversionRequest,
    format::{Format, ImageFormat},
};
use crate::utils::sidecar::{configure_command_no_window, get_sidecar_path};
use anyhow::{Context, Result};
use async_trait::async_trait;
use tokio::process::Command;

pub struct ImageConverter;

impl ImageConverter {
    pub fn new() -> Self {
        Self
    }

    fn output_formats() -> Vec<Format> {
        vec![
            Format::Image(ImageFormat::JPG),
            Format::Image(ImageFormat::JPEG),
            Format::Image(ImageFormat::PNG),
            Format::Image(ImageFormat::WEBP),
            Format::Image(ImageFormat::GIF),
            Format::Image(ImageFormat::BMP),
            Format::Image(ImageFormat::TIFF),
            Format::Image(ImageFormat::HEIC),
            Format::Image(ImageFormat::ICO),
        ]
    }

    fn input_formats() -> Vec<Format> {
        let mut inputs = Self::output_formats();
        // SVG: rsvg rasterizes for read; ImageMagick has no SVG writer.
        inputs.push(Format::Image(ImageFormat::SVG));
        inputs
    }
}

#[async_trait]
impl Converter for ImageConverter {
    fn supported_inputs(&self) -> Vec<Format> {
        Self::input_formats()
    }

    fn supported_outputs(&self) -> Vec<Format> {
        Self::output_formats()
    }

    fn can_convert(&self, from: &Format, to: &Format) -> bool {
        matches!(from, Format::Image(_))
            && matches!(to, Format::Image(_))
            && !matches!(to, Format::Image(ImageFormat::SVG))
    }

    async fn convert(
        &self,
        request: &ConversionRequest,
        progress_callback: Box<dyn Fn(f32) + Send + Sync>,
    ) -> Result<String> {
        progress_callback(0.05);

        let magick_path = get_sidecar_path("magick")
            .or_else(|_| get_sidecar_path("convert"))
            .context("ImageMagick not found")?;

        let output_path = request
            .output_path
            .clone()
            .unwrap_or_else(|| self.generate_output_path(&request.input_path, &request.output_format));

        let mut cmd = Command::new(&magick_path);
        configure_command_no_window(&mut cmd);

        // Limit memory thrashing on big files; use all CPUs.
        cmd.args([
            "-limit", "memory", "2GiB",
            "-limit", "map", "4GiB",
        ]);
        cmd.arg(&request.input_path);

        // Strip metadata for smaller outputs unless caller asks otherwise.
        cmd.arg("-strip");

        if let Some(quality) = request.quality {
            cmd.args(["-quality", &quality.to_string()]);
        } else if matches!(
            request.output_format,
            Format::Image(ImageFormat::JPG | ImageFormat::JPEG | ImageFormat::WEBP | ImageFormat::HEIC)
        ) {
            cmd.args(["-quality", "85"]);
        }

        cmd.arg(&output_path);

        progress_callback(0.4);

        let output = cmd
            .output()
            .await
            .context("Failed to execute ImageMagick")?;

        if !output.status.success() {
            anyhow::bail!(
                "ImageMagick conversion failed: {}",
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
    fn test_can_convert_images() {
        let converter = ImageConverter::new();
        let from = Format::Image(ImageFormat::JPG);
        let to = Format::Image(ImageFormat::PNG);
        assert!(converter.can_convert(&from, &to));
    }

    #[test]
    fn test_cannot_convert_non_images() {
        let converter = ImageConverter::new();
        let from = Format::Image(ImageFormat::JPG);
        let to = Format::Video(crate::models::format::VideoFormat::MP4);
        assert!(!converter.can_convert(&from, &to));
    }

    #[test]
    fn test_svg_is_input_only() {
        let converter = ImageConverter::new();
        let from = Format::Image(ImageFormat::SVG);
        let to = Format::Image(ImageFormat::PNG);
        assert!(converter.can_convert(&from, &to));

        let bad_to = Format::Image(ImageFormat::SVG);
        assert!(!converter.can_convert(&from, &bad_to));
    }
}
