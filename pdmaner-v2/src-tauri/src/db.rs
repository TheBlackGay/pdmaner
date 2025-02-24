use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite, Row};
use std::sync::Arc;
use uuid::Uuid;
use tauri::api::path::app_data_dir;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProjectParams {
    name: String,
    description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTableParams {
    name: String,
    comment: Option<String>,
}

pub struct Database {
    pool: Arc<Pool<Sqlite>>,
}

impl Database {
    pub async fn new() -> Result<Self> {
        // 获取应用数据目录
        let app_data_dir = app_data_dir(&tauri::Config::default())
            .ok_or_else(|| anyhow::anyhow!("Failed to get app data dir"))?;
        
        // 创建数据目录（如果不存在）
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| anyhow::anyhow!("Failed to create app data directory: {}", e))?;
        
        // 构建数据库文件路径
        let db_path = app_data_dir.join("pdmaner.db");
        println!("Database path: {}", db_path.display());

        // 确保数据库文件所在目录存在
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| anyhow::anyhow!("Failed to create database directory: {}", e))?;
        }

        let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy().replace(" ", "%20"));
        println!("Database URL: {}", db_url);

        let pool = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to connect to database: {}", e))?;
        
        // 初始化数据库表
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );"
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS tables (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            );"
        )
        .execute(&pool)
        .await?;

        println!("Database initialized successfully");

        Ok(Self {
            pool: Arc::new(pool),
        })
    }

    pub async fn get_projects(&self) -> Result<Vec<serde_json::Value>> {
        let rows = sqlx::query(
            "SELECT 
                id, name, description, 
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
                "createdAt": row.get::<String, _>("created_at"),
                "updatedAt": row.get::<String, _>("updated_at"),
            }));
        }

        Ok(projects)
    }

    pub async fn create_project(&self, params: CreateProjectParams) -> Result<serde_json::Value> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO projects (
                id, name, description, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&params.name)
        .bind(&params.description)
        .bind(&now)
        .bind(&now)
        .execute(&*self.pool)
        .await?;

        Ok(serde_json::json!({
            "id": id,
            "name": params.name,
            "description": params.description,
            "createdAt": now,
            "updatedAt": now,
        }))
    }

    // 添加一个方法用于创建示例项目
    pub async fn create_sample_projects(&self) -> Result<()> {
        let sample_projects = vec![
            CreateProjectParams {
                name: "电商系统".to_string(),
                description: Some("包含用户、商品、订单等核心模块的电商系统".to_string()),
            },
            CreateProjectParams {
                name: "博客系统".to_string(),
                description: Some("具有文章、评论、标签等功能的个人博客系统".to_string()),
            },
            CreateProjectParams {
                name: "CRM系统".to_string(),
                description: Some("客户关系管理系统，包含客户、联系人、商机等模块".to_string()),
            },
            CreateProjectParams {
                name: "HR管理系统".to_string(),
                description: Some("人力资源管理系统，包含员工、部门、考勤等功能".to_string()),
            },
        ];

        for project in sample_projects {
            self.create_project(project).await?;
        }

        Ok(())
    }

    pub async fn get_tables(&self, project_id: &str) -> Result<Vec<serde_json::Value>> {
        let rows = sqlx::query(
            "SELECT 
                id, name, comment, 
                created_at, updated_at
            FROM tables
            WHERE project_id = ?
            ORDER BY created_at ASC"
        )
        .bind(project_id)
        .fetch_all(&*self.pool)
        .await?;

        let mut tables = Vec::new();
        for row in rows {
            tables.push(serde_json::json!({
                "id": row.get::<String, _>("id"),
                "name": row.get::<String, _>("name"),
                "comment": row.get::<Option<String>, _>("comment"),
                "createdAt": row.get::<String, _>("created_at"),
                "updatedAt": row.get::<String, _>("updated_at"),
                "fields": Vec::<String>::new(), // 暂时返回空字段列表
            }));
        }

        Ok(tables)
    }

    pub async fn create_table(&self, project_id: &str, params: CreateTableParams) -> Result<serde_json::Value> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO tables (
                id, project_id, name, comment,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(project_id)
        .bind(&params.name)
        .bind(&params.comment)
        .bind(&now)
        .bind(&now)
        .execute(&*self.pool)
        .await?;

        Ok(serde_json::json!({
            "id": id,
            "name": params.name,
            "comment": params.comment,
            "createdAt": now,
            "updatedAt": now,
            "fields": Vec::<String>::new(), // 暂时返回空字段列表
        }))
    }
} 