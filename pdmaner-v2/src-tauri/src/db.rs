use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectParams {
    name: String,
    description: Option<String>,
    database: DatabaseConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseConfig {
    r#type: String,
    version: Option<String>,
}

pub struct Database {
    pool: Arc<Pool<Sqlite>>,
}

impl Database {
    pub async fn new() -> Result<Self> {
        let pool = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(5)
            .connect("sqlite:pdmaner.db")
            .await?;
        
        // 初始化数据库表
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                database_type TEXT NOT NULL,
                database_version TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );"
        )
        .execute(&pool)
        .await?;

        Ok(Self {
            pool: Arc::new(pool),
        })
    }

    pub async fn get_projects(&self) -> Result<Vec<serde_json::Value>> {
        let rows = sqlx::query(
            "SELECT 
                id, name, description, 
                database_type, database_version,
                created_at, updated_at
            FROM projects
            ORDER BY updated_at DESC"
        )
        .fetch_all(&*self.pool)
        .await?;

        let mut projects = Vec::new();
        for row in rows {
            projects.push(serde_json::json!({
                "id": row.get::<String, _>("id"),
                "name": row.get::<String, _>("name"),
                "description": row.get::<Option<String>, _>("description"),
                "database": {
                    "type": row.get::<String, _>("database_type"),
                    "version": row.get::<Option<String>, _>("database_version"),
                },
                "createdAt": row.get::<String, _>("created_at"),
                "updatedAt": row.get::<String, _>("updated_at"),
            }));
        }

        Ok(projects)
    }

    pub async fn create_project(&self, params: CreateProjectParams) -> Result<serde_json::Value> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();

        sqlx::query(
            "INSERT INTO projects (
                id, name, description, 
                database_type, database_version,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&params.name)
        .bind(&params.description)
        .bind(&params.database.r#type)
        .bind(&params.database.version)
        .bind(&now)
        .bind(&now)
        .execute(&*self.pool)
        .await?;

        Ok(serde_json::json!({
            "id": id,
            "name": params.name,
            "description": params.description,
            "database": {
                "type": params.database.r#type,
                "version": params.database.version,
            },
            "createdAt": now.to_rfc3339(),
            "updatedAt": now.to_rfc3339(),
        }))
    }
} 