use anyhow::Result;
use std::path::PathBuf;

pub fn get_sidecar_path(name: &str) -> Result<PathBuf> {
    let cwd = std::env::current_dir().ok();

    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(c) = &cwd {
        candidates.push(c.join("src-tauri").join("binaries").join(name));
        candidates.push(c.join("binaries").join(name));
    }
    candidates.push(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries").join(name));

    for mut path in candidates {
        #[cfg(target_os = "windows")]
        {
            if path.extension().is_none() {
                path.set_extension("exe");
            }
        }
        if path.exists() {
            return Ok(path);
        }
    }

    anyhow::bail!(
        "Sidecar binary '{}' not found. Run scripts/download-binaries.ps1 first.",
        name
    )
}

pub fn detect_format_from_path(path: &str) -> Option<crate::models::format::Format> {
    let p = std::path::Path::new(path);
    let ext = p.extension()?.to_str()?;
    crate::models::format::Format::from_extension(ext)
}

/// Prevents the brief Windows console flash when spawning a sidecar binary.
/// On non-Windows targets this is a no-op.
#[cfg(target_os = "windows")]
pub fn configure_command_no_window(cmd: &mut tokio::process::Command) {
    // CREATE_NO_WINDOW — tokio's Command exposes this directly on Windows.
    cmd.creation_flags(0x08000000);
}

#[cfg(not(target_os = "windows"))]
pub fn configure_command_no_window(_cmd: &mut tokio::process::Command) {}
