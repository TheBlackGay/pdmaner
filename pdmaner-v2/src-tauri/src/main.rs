#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod db;

use db::{Database, CreateProjectParams, CreateTableParams, CreateFieldParams, UpdateTableParams, UpdateFieldParams};
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

#[tauri::command]
async fn get_tables(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    state
        .db
        .get_tables(&project_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_table(
    project_id: String,
    params: CreateTableParams,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .db
        .create_table(&project_id, params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_sample_projects(state: State<'_, AppState>) -> Result<(), String> {
    state
        .db
        .create_sample_projects()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_table_with_fields(
    table_id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .db
        .get_table_with_fields(&table_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_field(
    table_id: String,
    params: CreateFieldParams,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .db
        .create_field(&table_id, params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_table(
    table_id: String,
    params: UpdateTableParams,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .db
        .update_table(&table_id, params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_field(
    field_id: String,
    params: UpdateFieldParams,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    state
        .db
        .update_field(&field_id, params)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_table(
    table_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .db
        .delete_table(&table_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_field(
    field_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .db
        .delete_field(&field_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn reorder_fields(
    table_id: String,
    field_ids: Vec<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .db
        .reorder_fields(&table_id, field_ids)
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
        .invoke_handler(tauri::generate_handler![
            get_projects,
            create_project,
            create_sample_projects,
            get_tables,
            create_table,
            get_table_with_fields,
            create_field,
            update_table,
            update_field,
            delete_table,
            delete_field,
            reorder_fields
        ])
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