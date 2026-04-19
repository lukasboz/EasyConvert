pub mod commands;
pub mod converters;
pub mod models;
pub mod router;
pub mod utils;

use router::format_router::FormatRouter;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let router = Arc::new(FormatRouter::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(router)
        .invoke_handler(tauri::generate_handler![
            commands::convert::convert_file,
            commands::convert::batch_convert,
            commands::convert::validate_conversion,
            commands::convert::get_supported_outputs,
            commands::convert::get_file_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
