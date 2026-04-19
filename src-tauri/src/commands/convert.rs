use crate::models::conversion::{ConversionRequest, ConversionResponse, FileInfo};
use crate::models::format::Format;
use crate::router::format_router::FormatRouter;
use crate::utils::sidecar::detect_format_from_path;
use std::sync::Arc;
use tauri::{Emitter, State};

#[tauri::command]
pub async fn convert_file(
    request: ConversionRequest,
    router: State<'_, Arc<FormatRouter>>,
    window: tauri::Window,
) -> Result<ConversionResponse, String> {
    let router_arc = router.inner().clone();
    run_conversion(request, router_arc, window).await
}

async fn run_conversion(
    request: ConversionRequest,
    router: Arc<FormatRouter>,
    window: tauri::Window,
) -> Result<ConversionResponse, String> {
    let start = std::time::Instant::now();

    let input_format = detect_format_from_path(&request.input_path)
        .ok_or_else(|| "Could not detect input file format".to_string())?;

    let converter = router
        .get_converter(&input_format, &request.output_format)
        .map_err(|e| e.to_string())?;

    let progress_callback = {
        let window = window.clone();
        let file_id = request.file_id.clone();
        Box::new(move |progress: f32| {
            let _ = window.emit("conversion-progress", (file_id.clone(), progress));
        })
    };

    let result = converter.convert(&request, progress_callback).await;
    let duration_ms = start.elapsed().as_millis() as u64;

    match result {
        Ok(output_path) => Ok(ConversionResponse {
            success: true,
            output_path: Some(output_path),
            error: None,
            duration_ms,
        }),
        Err(err) => Ok(ConversionResponse {
            success: false,
            output_path: None,
            error: Some(err.to_string()),
            duration_ms,
        }),
    }
}

#[tauri::command]
pub async fn batch_convert(
    requests: Vec<ConversionRequest>,
    router: State<'_, Arc<FormatRouter>>,
    window: tauri::Window,
) -> Result<Vec<ConversionResponse>, String> {
    use tokio::sync::Semaphore;

    let parallelism = std::cmp::max(
        1,
        std::thread::available_parallelism()
            .map(|n| (n.get() / 2).max(1))
            .unwrap_or(2),
    );
    let sem = Arc::new(Semaphore::new(parallelism));
    let router_arc = router.inner().clone();

    let mut handles = Vec::with_capacity(requests.len());
    for request in requests {
        let sem = sem.clone();
        let router = router_arc.clone();
        let window = window.clone();
        handles.push(tokio::spawn(async move {
            let _permit = sem.acquire_owned().await.expect("semaphore closed");
            run_conversion(request, router, window).await
        }));
    }

    let mut responses = Vec::with_capacity(handles.len());
    for h in handles {
        match h.await {
            Ok(Ok(resp)) => responses.push(resp),
            Ok(Err(e)) => responses.push(ConversionResponse {
                success: false,
                output_path: None,
                error: Some(e),
                duration_ms: 0,
            }),
            Err(e) => responses.push(ConversionResponse {
                success: false,
                output_path: None,
                error: Some(format!("worker panicked: {}", e)),
                duration_ms: 0,
            }),
        }
    }

    Ok(responses)
}

#[tauri::command]
pub fn validate_conversion(
    input_format: Format,
    output_format: Format,
    router: State<'_, Arc<FormatRouter>>,
) -> Result<bool, String> {
    Ok(router.validate_conversion(&input_format, &output_format))
}

#[tauri::command]
pub fn get_supported_outputs(
    input_format: Format,
    router: State<'_, Arc<FormatRouter>>,
) -> Result<Vec<Format>, String> {
    Ok(router.get_supported_outputs(&input_format))
}

#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let metadata = tokio::fs::metadata(&path).await.map_err(|e| e.to_string())?;
    let detected_format = detect_format_from_path(&path);
    Ok(FileInfo {
        path,
        size: metadata.len(),
        detected_format,
        mime_type: None,
    })
}
