use super::traits::Converter;
use crate::models::{
    conversion::ConversionRequest,
    format::{ArchiveFormat, Format},
};
use crate::utils::sidecar::{configure_command_no_window, get_sidecar_path};
use anyhow::{Context, Result};
use async_trait::async_trait;
use tokio::process::Command;

pub struct ArchiveConverter;

impl ArchiveConverter {
    pub fn new() -> Self {
        Self
    }

    fn all_formats() -> Vec<Format> {
        vec![
            Format::Archive(ArchiveFormat::ZIP),
            Format::Archive(ArchiveFormat::SEVENZ),
            Format::Archive(ArchiveFormat::TAR),
            Format::Archive(ArchiveFormat::GZ),
            Format::Archive(ArchiveFormat::BZIP2),
            Format::Archive(ArchiveFormat::XZ),
        ]
    }
}

#[async_trait]
impl Converter for ArchiveConverter {
    fn supported_inputs(&self) -> Vec<Format> {
        Self::all_formats()
    }

    fn supported_outputs(&self) -> Vec<Format> {
        Self::all_formats()
    }

    fn can_convert(&self, from: &Format, to: &Format) -> bool {
        matches!(from, Format::Archive(_)) && matches!(to, Format::Archive(_))
    }

    async fn convert(
        &self,
        request: &ConversionRequest,
        progress_callback: Box<dyn Fn(f32) + Send + Sync>,
    ) -> Result<String> {
        progress_callback(0.05);

        let sevenzip_path = get_sidecar_path("7z").context("7zip not found")?;

        let output_path = request
            .output_path
            .clone()
            .unwrap_or_else(|| self.generate_output_path(&request.input_path, &request.output_format));

        // Use a unique temp dir per conversion so parallel jobs don't collide.
        let temp_dir = std::env::temp_dir().join(format!("easyconvert_{}", uuid::Uuid::new_v4()));
        tokio::fs::create_dir_all(&temp_dir)
            .await
            .context("Failed to create temp dir")?;
        let cleanup = TempDirGuard(temp_dir.clone());

        progress_callback(0.15);

        // 1) Extract
        let mut extract = Command::new(&sevenzip_path);
        configure_command_no_window(&mut extract);
        extract
            .arg("x")
            .arg(&request.input_path)
            .arg(format!("-o{}", temp_dir.display()))
            .arg("-y")
            .arg("-bso0")
            .arg("-bsp0");
        let extract_out = extract.output().await.context("Failed to extract archive")?;
        if !extract_out.status.success() {
            anyhow::bail!(
                "Archive extraction failed: {}",
                String::from_utf8_lossy(&extract_out.stderr).trim()
            );
        }

        progress_callback(0.55);

        // 2) Compress
        let archive_type = match &request.output_format {
            Format::Archive(ArchiveFormat::ZIP) => "zip",
            Format::Archive(ArchiveFormat::SEVENZ) => "7z",
            Format::Archive(ArchiveFormat::TAR) => "tar",
            Format::Archive(ArchiveFormat::GZ) => "gzip",
            Format::Archive(ArchiveFormat::BZIP2) => "bzip2",
            Format::Archive(ArchiveFormat::XZ) => "xz",
            _ => anyhow::bail!("Unsupported archive format"),
        };

        // gzip/bzip2/xz are stream compressors operating on a single file. Bundle as tar first.
        let needs_tar_wrap = matches!(archive_type, "gzip" | "bzip2" | "xz");
        let (final_input, intermediate_tar) = if needs_tar_wrap {
            let tar_path = temp_dir.join("__bundle.tar");
            let mut mk_tar = Command::new(&sevenzip_path);
            configure_command_no_window(&mut mk_tar);
            mk_tar
                .arg("a")
                .arg("-ttar")
                .arg(&tar_path)
                .arg(format!("{}{}*", temp_dir.display(), std::path::MAIN_SEPARATOR))
                .arg("-y")
                .arg("-bso0")
                .arg("-bsp0");
            let tar_out = mk_tar.output().await.context("Failed to build intermediate tar")?;
            if !tar_out.status.success() {
                anyhow::bail!(
                    "Intermediate tar creation failed: {}",
                    String::from_utf8_lossy(&tar_out.stderr).trim()
                );
            }
            (tar_path.to_string_lossy().to_string(), true)
        } else {
            (
                format!("{}{}*", temp_dir.display(), std::path::MAIN_SEPARATOR),
                false,
            )
        };

        let mut compress = Command::new(&sevenzip_path);
        configure_command_no_window(&mut compress);
        compress
            .arg("a")
            .arg(format!("-t{}", archive_type))
            // Use multi-threaded compression where supported.
            .arg("-mmt=on")
            .arg(&output_path)
            .arg(&final_input)
            .arg("-y")
            .arg("-bso0")
            .arg("-bsp0");

        let compress_out = compress.output().await.context("Failed to create archive")?;

        progress_callback(0.95);

        if !compress_out.status.success() {
            anyhow::bail!(
                "Archive creation failed: {}",
                String::from_utf8_lossy(&compress_out.stderr).trim()
            );
        }

        let _ = intermediate_tar; // keep for clarity
        drop(cleanup);

        progress_callback(1.0);
        Ok(output_path)
    }
}

struct TempDirGuard(std::path::PathBuf);

impl Drop for TempDirGuard {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_convert_archives() {
        let converter = ArchiveConverter::new();
        let from = Format::Archive(ArchiveFormat::ZIP);
        let to = Format::Archive(ArchiveFormat::SEVENZ);
        assert!(converter.can_convert(&from, &to));
    }

    #[test]
    fn test_cannot_convert_non_archives() {
        let converter = ArchiveConverter::new();
        let from = Format::Archive(ArchiveFormat::ZIP);
        let to = Format::Image(crate::models::format::ImageFormat::PNG);
        assert!(!converter.can_convert(&from, &to));
    }
}
