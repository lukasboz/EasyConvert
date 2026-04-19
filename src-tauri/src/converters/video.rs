use super::traits::Converter;
use crate::models::{
    conversion::ConversionRequest,
    format::{AudioFormat, Format, VideoFormat},
};
use crate::utils::sidecar::{configure_command_no_window, get_sidecar_path};
use anyhow::{Context, Result};
use async_trait::async_trait;
use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncReadExt, BufReader};
use tokio::process::Command;

pub struct VideoConverter;

impl VideoConverter {
    pub fn new() -> Self {
        Self
    }

    fn all_video_formats() -> Vec<Format> {
        vec![
            Format::Video(VideoFormat::MP4),
            Format::Video(VideoFormat::MKV),
            Format::Video(VideoFormat::WEBM),
            Format::Video(VideoFormat::MOV),
            Format::Video(VideoFormat::AVI),
            Format::Video(VideoFormat::FLV),
            Format::Video(VideoFormat::THREEGP),
            Format::Video(VideoFormat::M4V),
            Format::Video(VideoFormat::TS),
            Format::Video(VideoFormat::WMV),
        ]
    }

    fn all_audio_formats() -> Vec<Format> {
        vec![
            Format::Audio(AudioFormat::MP3),
            Format::Audio(AudioFormat::WAV),
            Format::Audio(AudioFormat::FLAC),
            Format::Audio(AudioFormat::AAC),
            Format::Audio(AudioFormat::OGG),
            Format::Audio(AudioFormat::M4A),
            Format::Audio(AudioFormat::OPUS),
            Format::Audio(AudioFormat::WMA),
            Format::Audio(AudioFormat::ALAC),
        ]
    }

    /// Probe input duration in seconds via ffprobe-like ffmpeg call. Best-effort.
    async fn probe_duration_secs(ffmpeg: &std::path::Path, input: &str) -> Option<f64> {
        let mut cmd = Command::new(ffmpeg);
        configure_command_no_window(&mut cmd);
        cmd.args(["-i", input]).stderr(Stdio::piped()).stdout(Stdio::null());
        let output = cmd.output().await.ok()?;
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Look for "Duration: HH:MM:SS.xx"
        let idx = stderr.find("Duration:")?;
        let tail = &stderr[idx + "Duration:".len()..];
        let dur_str = tail.split(',').next()?.trim();
        let mut parts = dur_str.split(':');
        let h: f64 = parts.next()?.trim().parse().ok()?;
        let m: f64 = parts.next()?.trim().parse().ok()?;
        let s: f64 = parts.next()?.trim().parse().ok()?;
        Some(h * 3600.0 + m * 60.0 + s)
    }
}

#[async_trait]
impl Converter for VideoConverter {
    fn supported_inputs(&self) -> Vec<Format> {
        let mut formats = Self::all_video_formats();
        formats.extend(Self::all_audio_formats());
        formats
    }

    fn supported_outputs(&self) -> Vec<Format> {
        let mut formats = Self::all_video_formats();
        formats.extend(Self::all_audio_formats());
        formats
    }

    fn can_convert(&self, from: &Format, to: &Format) -> bool {
        let is_media_input = matches!(from, Format::Video(_) | Format::Audio(_));
        let is_media_output = matches!(to, Format::Video(_) | Format::Audio(_));
        is_media_input && is_media_output
    }

    async fn convert(
        &self,
        request: &ConversionRequest,
        progress_callback: Box<dyn Fn(f32) + Send + Sync>,
    ) -> Result<String> {
        progress_callback(0.02);

        let ffmpeg_path = get_sidecar_path("ffmpeg").context("FFmpeg not found")?;

        let output_path = request
            .output_path
            .clone()
            .unwrap_or_else(|| self.generate_output_path(&request.input_path, &request.output_format));

        let duration = Self::probe_duration_secs(&ffmpeg_path, &request.input_path).await;
        progress_callback(0.05);

        let mut cmd = Command::new(&ffmpeg_path);
        configure_command_no_window(&mut cmd);

        // Hide banner, treat all CPUs as available
        cmd.args(["-hide_banner", "-loglevel", "error", "-nostats"]);
        cmd.args(["-y"]);
        cmd.args(["-i", &request.input_path]);
        cmd.args(["-threads", "0"]);

        // Stream progress to stdout in key=value form, one line per metric.
        cmd.args(["-progress", "pipe:1"]);

        // Encoder defaults — fast preset for video to keep conversions snappy.
        if matches!(request.output_format, Format::Video(_)) {
            // Use libx264 default; -preset fast gives good speed/quality tradeoff.
            cmd.args(["-preset", "fast"]);
        }

        // Explicit codec selection for outputs FFmpeg can't infer from extension alone.
        match &request.output_format {
            Format::Audio(AudioFormat::OPUS) => {
                cmd.args(["-c:a", "libopus"]);
            }
            Format::Audio(AudioFormat::WMA) => {
                cmd.args(["-c:a", "wmav2"]);
            }
            Format::Audio(AudioFormat::ALAC) => {
                cmd.args(["-c:a", "alac"]);
            }
            _ => {}
        }

        if let Some(quality) = request.quality {
            match &request.output_format {
                // Lossless audio targets: bitrate flag is meaningless, skip.
                Format::Audio(AudioFormat::FLAC | AudioFormat::WAV | AudioFormat::ALAC) => {}
                Format::Video(_) => {
                    let crf = 35u8.saturating_sub(((quality as f32 / 100.0) * 17.0) as u8);
                    cmd.args(["-crf", &crf.to_string()]);
                }
                Format::Audio(_) => {
                    let bitrate = 64 + ((quality as u32) * 256 / 100);
                    cmd.args(["-b:a", &format!("{}k", bitrate)]);
                }
                _ => {}
            }
        }

        cmd.arg(&output_path);
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        let mut child = cmd.spawn().context("Failed to spawn FFmpeg")?;
        let stdout = child.stdout.take().context("FFmpeg stdout missing")?;
        let stderr = child.stderr.take().context("FFmpeg stderr missing")?;

        // Drain stderr so the process doesn't block on a full pipe; collect for errors.
        let stderr_handle = tokio::spawn(async move {
            let mut reader = BufReader::new(stderr);
            let mut buf = String::new();
            let _ = reader.read_to_string(&mut buf).await;
            buf
        });

        let mut reader = BufReader::new(stdout).lines();
        while let Some(line) = reader.next_line().await.transpose() {
            let Ok(line) = line else { break };
            if let Some(rest) = line.strip_prefix("out_time_us=") {
                if let (Ok(us), Some(total)) = (rest.trim().parse::<u64>(), duration) {
                    if total > 0.0 {
                        let secs = us as f64 / 1_000_000.0;
                        let pct = (secs / total).clamp(0.0, 0.98) as f32;
                        progress_callback(pct.max(0.05));
                    }
                }
            } else if let Some(rest) = line.strip_prefix("out_time_ms=") {
                if let (Ok(ms), Some(total)) = (rest.trim().parse::<u64>(), duration) {
                    if total > 0.0 {
                        let secs = ms as f64 / 1_000_000.0; // ffmpeg out_time_ms is actually µs
                        let pct = (secs / total).clamp(0.0, 0.98) as f32;
                        progress_callback(pct.max(0.05));
                    }
                }
            } else if line.starts_with("progress=end") {
                progress_callback(0.99);
            }
        }

        let status = child.wait().await.context("FFmpeg failed to finish")?;
        let stderr_text = stderr_handle.await.unwrap_or_default();

        if !status.success() {
            let trimmed = stderr_text.trim();
            let snippet = if trimmed.is_empty() {
                "FFmpeg exited with non-zero status".to_string()
            } else {
                trimmed.lines().rev().take(3).collect::<Vec<_>>().into_iter().rev().collect::<Vec<_>>().join(" | ")
            };
            anyhow::bail!("FFmpeg conversion failed: {}", snippet);
        }

        progress_callback(1.0);
        Ok(output_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_convert_video() {
        let converter = VideoConverter::new();
        let from = Format::Video(VideoFormat::MP4);
        let to = Format::Video(VideoFormat::MKV);
        assert!(converter.can_convert(&from, &to));
    }

    #[test]
    fn test_can_convert_audio() {
        let converter = VideoConverter::new();
        let from = Format::Audio(AudioFormat::MP3);
        let to = Format::Audio(AudioFormat::FLAC);
        assert!(converter.can_convert(&from, &to));
    }

    #[test]
    fn test_can_convert_video_to_audio() {
        let converter = VideoConverter::new();
        let from = Format::Video(VideoFormat::MP4);
        let to = Format::Audio(AudioFormat::MP3);
        assert!(converter.can_convert(&from, &to));
    }
}
