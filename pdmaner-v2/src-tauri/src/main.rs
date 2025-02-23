#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod db;

use db::{Database, CreateProjectParams};
use std::sync::Arc;
use tauri::{Manager, State};

struct AppState {
    db: Arc<Database>,
}

#[tauri::command]
async fn get_projects(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    state
        .db
        .get_projects()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_project(
    params: CreateProjectParams,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .db
        .create_project(params)
        .await
        .map_err(|e| e.to_string())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = Database::new().await?;
    let app_state = AppState {
        db: Arc::new(db),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![get_projects, create_project])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let main_window = app.get_window("main").unwrap();
                main_window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
} 