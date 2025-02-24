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

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFieldParams {
    name: String,
    comment: Option<String>,
    #[serde(rename = "typeName")]
    type_name: String,
    length: Option<i32>,
    precision: Option<i32>,
    scale: Option<i32>,
    nullable: bool,
    #[serde(rename = "primaryKey")]
    primary_key: bool,
    #[serde(rename = "autoIncrement")]
    auto_increment: bool,
    #[serde(rename = "defaultValue")]
    default_value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTableParams {
    name: String,
    comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateFieldParams {
    name: String,
    comment: Option<String>,
    #[serde(rename = "typeName")]
    type_name: String,
    length: Option<i32>,
    precision: Option<i32>,
    scale: Option<i32>,
    nullable: bool,
    #[serde(rename = "primaryKey")]
    primary_key: bool,
    #[serde(rename = "autoIncrement")]
    auto_increment: bool,
    #[serde(rename = "defaultValue")]
    default_value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateIndexParams {
    name: String,
    #[serde(rename = "type")]
    index_type: String,
    comment: Option<String>,
    fields: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateIndexParams {
    name: String,
    #[serde(rename = "type")]
    index_type: String,
    comment: Option<String>,
    fields: Vec<String>,
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

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS fields (
                id TEXT PRIMARY KEY,
                table_id TEXT NOT NULL,
                name TEXT NOT NULL,
                comment TEXT,
                type_name TEXT NOT NULL,
                length INTEGER,
                precision INTEGER,
                scale INTEGER,
                nullable BOOLEAN NOT NULL DEFAULT 1,
                primary_key BOOLEAN NOT NULL DEFAULT 0,
                auto_increment BOOLEAN NOT NULL DEFAULT 0,
                default_value TEXT,
                order_index INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (table_id) REFERENCES tables (id)
            );"
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS indexes (
                id TEXT PRIMARY KEY,
                table_id TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('UNIQUE', 'NORMAL', 'FULLTEXT')),
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (table_id) REFERENCES tables (id)
            );"
        )
        .execute(&pool)
        .await?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS index_fields (
                id TEXT PRIMARY KEY,
                index_id TEXT NOT NULL,
                field_id TEXT NOT NULL,
                order_index INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (index_id) REFERENCES indexes (id),
                FOREIGN KEY (field_id) REFERENCES fields (id)
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

    pub async fn get_table_with_fields(&self, table_id: &str) -> Result<serde_json::Value> {
        let table = sqlx::query(
            "SELECT 
                id, name, comment, 
                created_at, updated_at
            FROM tables
            WHERE id = ?"
        )
        .bind(table_id)
        .fetch_one(&*self.pool)
        .await?;

        let fields = sqlx::query(
            "SELECT 
                id, name, comment, type_name,
                length, precision, scale,
                nullable, primary_key, auto_increment,
                default_value, order_index,
                created_at, updated_at
            FROM fields
            WHERE table_id = ?
            ORDER BY order_index ASC"
        )
        .bind(table_id)
        .fetch_all(&*self.pool)
        .await?;

        let indexes = sqlx::query(
            "SELECT 
                id, name, type, comment,
                created_at, updated_at
            FROM indexes
            WHERE table_id = ?
            ORDER BY created_at ASC"
        )
        .bind(table_id)
        .fetch_all(&*self.pool)
        .await?;

        let mut field_list = Vec::new();
        for field in fields {
            field_list.push(serde_json::json!({
                "id": field.get::<String, _>("id"),
                "name": field.get::<String, _>("name"),
                "comment": field.get::<Option<String>, _>("comment"),
                "typeName": field.get::<String, _>("type_name"),
                "length": field.get::<Option<i32>, _>("length"),
                "precision": field.get::<Option<i32>, _>("precision"),
                "scale": field.get::<Option<i32>, _>("scale"),
                "nullable": field.get::<bool, _>("nullable"),
                "primaryKey": field.get::<bool, _>("primary_key"),
                "autoIncrement": field.get::<bool, _>("auto_increment"),
                "defaultValue": field.get::<Option<String>, _>("default_value"),
                "orderIndex": field.get::<i32, _>("order_index"),
                "createdAt": field.get::<String, _>("created_at"),
                "updatedAt": field.get::<String, _>("updated_at"),
            }));
        }

        let mut index_list = Vec::new();
        for index in indexes {
            let index_id = index.get::<String, _>("id");
            let index_fields = sqlx::query(
                "SELECT 
                    if.id, if.field_id, if.order_index,
                    f.name as field_name, f.comment as field_comment,
                    f.type_name, f.length, f.precision, f.scale,
                    f.nullable, f.primary_key, f.auto_increment,
                    f.default_value,
                    if.created_at, if.updated_at
                FROM index_fields if
                LEFT JOIN fields f ON f.id = if.field_id
                WHERE if.index_id = ?
                ORDER BY if.order_index ASC"
            )
            .bind(&index_id)
            .fetch_all(&*self.pool)
            .await?;

            let mut field_list = Vec::new();
            for field in index_fields {
                field_list.push(serde_json::json!({
                    "id": field.get::<String, _>("id"),
                    "fieldId": field.get::<String, _>("field_id"),
                    "orderIndex": field.get::<i32, _>("order_index"),
                    "field": {
                        "id": field.get::<String, _>("field_id"),
                        "name": field.get::<String, _>("field_name"),
                        "comment": field.get::<Option<String>, _>("field_comment"),
                        "typeName": field.get::<String, _>("type_name"),
                        "length": field.get::<Option<i32>, _>("length"),
                        "precision": field.get::<Option<i32>, _>("precision"),
                        "scale": field.get::<Option<i32>, _>("scale"),
                        "nullable": field.get::<bool, _>("nullable"),
                        "primaryKey": field.get::<bool, _>("primary_key"),
                        "autoIncrement": field.get::<bool, _>("auto_increment"),
                        "defaultValue": field.get::<Option<String>, _>("default_value"),
                    },
                    "createdAt": field.get::<String, _>("created_at"),
                    "updatedAt": field.get::<String, _>("updated_at"),
                }));
            }

            index_list.push(serde_json::json!({
                "id": index_id,
                "name": index.get::<String, _>("name"),
                "type": index.get::<String, _>("type"),
                "comment": index.get::<Option<String>, _>("comment"),
                "fields": field_list,
                "createdAt": index.get::<String, _>("created_at"),
                "updatedAt": index.get::<String, _>("updated_at"),
            }));
        }

        Ok(serde_json::json!({
            "id": table.get::<String, _>("id"),
            "name": table.get::<String, _>("name"),
            "comment": table.get::<Option<String>, _>("comment"),
            "createdAt": table.get::<String, _>("created_at"),
            "updatedAt": table.get::<String, _>("updated_at"),
            "fields": field_list,
            "indexes": index_list,
        }))
    }

    pub async fn create_field(&self, table_id: &str, params: CreateFieldParams) -> Result<serde_json::Value> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        // 获取当前最大的 order_index
        let max_order = sqlx::query(
            "SELECT COALESCE(MAX(order_index), -1) as max_order
            FROM fields
            WHERE table_id = ?"
        )
        .bind(table_id)
        .fetch_one(&*self.pool)
        .await?;

        let order_index = max_order.get::<i32, _>("max_order") + 1;

        sqlx::query(
            "INSERT INTO fields (
                id, table_id, name, comment,
                type_name, length, precision, scale,
                nullable, primary_key, auto_increment,
                default_value, order_index,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(table_id)
        .bind(&params.name)
        .bind(&params.comment)
        .bind(&params.type_name)
        .bind(params.length)
        .bind(params.precision)
        .bind(params.scale)
        .bind(params.nullable)
        .bind(params.primary_key)
        .bind(params.auto_increment)
        .bind(&params.default_value)
        .bind(order_index)
        .bind(&now)
        .bind(&now)
        .execute(&*self.pool)
        .await?;

        Ok(serde_json::json!({
            "id": id,
            "name": params.name,
            "comment": params.comment,
            "typeName": params.type_name,
            "length": params.length,
            "precision": params.precision,
            "scale": params.scale,
            "nullable": params.nullable,
            "primaryKey": params.primary_key,
            "autoIncrement": params.auto_increment,
            "defaultValue": params.default_value,
            "orderIndex": order_index,
            "createdAt": now,
            "updatedAt": now,
        }))
    }

    pub async fn update_table(&self, table_id: &str, params: UpdateTableParams) -> Result<serde_json::Value> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE tables 
            SET name = ?, comment = ?, updated_at = ?
            WHERE id = ?"
        )
        .bind(&params.name)
        .bind(&params.comment)
        .bind(&now)
        .bind(table_id)
        .execute(&*self.pool)
        .await?;

        Ok(serde_json::json!({
            "id": table_id,
            "name": params.name,
            "comment": params.comment,
            "updatedAt": now,
        }))
    }

    pub async fn update_field(&self, field_id: &str, params: UpdateFieldParams) -> Result<serde_json::Value> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE fields 
            SET name = ?, comment = ?, type_name = ?,
                length = ?, precision = ?, scale = ?,
                nullable = ?, primary_key = ?, auto_increment = ?,
                default_value = ?, updated_at = ?
            WHERE id = ?"
        )
        .bind(&params.name)
        .bind(&params.comment)
        .bind(&params.type_name)
        .bind(params.length)
        .bind(params.precision)
        .bind(params.scale)
        .bind(params.nullable)
        .bind(params.primary_key)
        .bind(params.auto_increment)
        .bind(&params.default_value)
        .bind(&now)
        .bind(field_id)
        .execute(&*self.pool)
        .await?;

        Ok(serde_json::json!({
            "id": field_id,
            "name": params.name,
            "comment": params.comment,
            "typeName": params.type_name,
            "length": params.length,
            "precision": params.precision,
            "scale": params.scale,
            "nullable": params.nullable,
            "primaryKey": params.primary_key,
            "autoIncrement": params.auto_increment,
            "defaultValue": params.default_value,
            "updatedAt": now,
        }))
    }

    pub async fn delete_table(&self, table_id: &str) -> Result<()> {
        // 先删除表的所有字段
        sqlx::query("DELETE FROM fields WHERE table_id = ?")
            .bind(table_id)
            .execute(&*self.pool)
            .await?;

        // 再删除表
        sqlx::query("DELETE FROM tables WHERE id = ?")
            .bind(table_id)
            .execute(&*self.pool)
            .await?;

        Ok(())
    }

    pub async fn delete_field(&self, field_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM fields WHERE id = ?")
            .bind(field_id)
            .execute(&*self.pool)
            .await?;

        Ok(())
    }

    pub async fn reorder_fields(&self, table_id: &str, field_ids: Vec<String>) -> Result<()> {
        for (index, field_id) in field_ids.iter().enumerate() {
            sqlx::query(
                "UPDATE fields 
                SET order_index = ?
                WHERE id = ? AND table_id = ?"
            )
            .bind(index as i32)
            .bind(field_id)
            .bind(table_id)
            .execute(&*self.pool)
            .await?;
        }

        Ok(())
    }

    pub async fn create_index(&self, table_id: &str, params: CreateIndexParams) -> Result<serde_json::Value> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT INTO indexes (
                id, table_id, name, type, comment,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(table_id)
        .bind(&params.name)
        .bind(&params.index_type)
        .bind(&params.comment)
        .bind(&now)
        .bind(&now)
        .execute(&*self.pool)
        .await?;

        // 创建索引字段关联
        for (i, field_id) in params.fields.iter().enumerate() {
            let index_field_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO index_fields (
                    id, index_id, field_id, order_index,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(&index_field_id)
            .bind(&id)
            .bind(field_id)
            .bind(i as i32)
            .bind(&now)
            .bind(&now)
            .execute(&*self.pool)
            .await?;
        }

        self.get_index(&id).await
    }

    pub async fn update_index(&self, index_id: &str, params: UpdateIndexParams) -> Result<serde_json::Value> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            "UPDATE indexes 
            SET name = ?, type = ?, comment = ?, updated_at = ?
            WHERE id = ?"
        )
        .bind(&params.name)
        .bind(&params.index_type)
        .bind(&params.comment)
        .bind(&now)
        .bind(index_id)
        .execute(&*self.pool)
        .await?;

        // 删除旧的索引字段关联
        sqlx::query("DELETE FROM index_fields WHERE index_id = ?")
            .bind(index_id)
            .execute(&*self.pool)
            .await?;

        // 创建新的索引字段关联
        for (i, field_id) in params.fields.iter().enumerate() {
            let index_field_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO index_fields (
                    id, index_id, field_id, order_index,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(&index_field_id)
            .bind(index_id)
            .bind(field_id)
            .bind(i as i32)
            .bind(&now)
            .bind(&now)
            .execute(&*self.pool)
            .await?;
        }

        self.get_index(index_id).await
    }

    pub async fn delete_index(&self, index_id: &str) -> Result<()> {
        // 先删除索引字段关联
        sqlx::query("DELETE FROM index_fields WHERE index_id = ?")
            .bind(index_id)
            .execute(&*self.pool)
            .await?;

        // 再删除索引
        sqlx::query("DELETE FROM indexes WHERE id = ?")
            .bind(index_id)
            .execute(&*self.pool)
            .await?;

        Ok(())
    }

    pub async fn get_index(&self, index_id: &str) -> Result<serde_json::Value> {
        let index = sqlx::query(
            "SELECT 
                id, name, type, comment,
                created_at, updated_at
            FROM indexes
            WHERE id = ?"
        )
        .bind(index_id)
        .fetch_one(&*self.pool)
        .await?;

        let index_fields = sqlx::query(
            "SELECT 
                if.id, if.field_id, if.order_index,
                f.name as field_name, f.comment as field_comment,
                f.type_name, f.length, f.precision, f.scale,
                f.nullable, f.primary_key, f.auto_increment,
                f.default_value,
                if.created_at, if.updated_at
            FROM index_fields if
            LEFT JOIN fields f ON f.id = if.field_id
            WHERE if.index_id = ?
            ORDER BY if.order_index ASC"
        )
        .bind(index_id)
        .fetch_all(&*self.pool)
        .await?;

        let mut field_list = Vec::new();
        for field in index_fields {
            field_list.push(serde_json::json!({
                "id": field.get::<String, _>("id"),
                "fieldId": field.get::<String, _>("field_id"),
                "orderIndex": field.get::<i32, _>("order_index"),
                "field": {
                    "id": field.get::<String, _>("field_id"),
                    "name": field.get::<String, _>("field_name"),
                    "comment": field.get::<Option<String>, _>("field_comment"),
                    "typeName": field.get::<String, _>("type_name"),
                    "length": field.get::<Option<i32>, _>("length"),
                    "precision": field.get::<Option<i32>, _>("precision"),
                    "scale": field.get::<Option<i32>, _>("scale"),
                    "nullable": field.get::<bool, _>("nullable"),
                    "primaryKey": field.get::<bool, _>("primary_key"),
                    "autoIncrement": field.get::<bool, _>("auto_increment"),
                    "defaultValue": field.get::<Option<String>, _>("default_value"),
                },
                "createdAt": field.get::<String, _>("created_at"),
                "updatedAt": field.get::<String, _>("updated_at"),
            }));
        }

        Ok(serde_json::json!({
            "id": index.get::<String, _>("id"),
            "name": index.get::<String, _>("name"),
            "type": index.get::<String, _>("type"),
            "comment": index.get::<Option<String>, _>("comment"),
            "fields": field_list,
            "createdAt": index.get::<String, _>("created_at"),
            "updatedAt": index.get::<String, _>("updated_at"),
        }))
    }
} 