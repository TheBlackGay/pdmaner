import type { CreateTableParams, CreateFieldParams, CreateIndexParams } from '@/types/table'

interface ParsedTable {
  table: CreateTableParams
  fields: CreateFieldParams[]
  indexes: CreateIndexParams[]
}

export class SQLParser {
  private sql: string
  private dbType: 'mysql' | 'doris'

  constructor(sql: string, dbType: 'mysql' | 'doris') {
    this.sql = sql.trim()
    this.dbType = dbType
  }

  parse(): ParsedTable[] {
    const tables: ParsedTable[] = []
    const createTableStatements = this.splitStatements()

    for (const statement of createTableStatements) {
      try {
        const parsedTable = this.parseCreateTable(statement)
        if (parsedTable) {
          tables.push(parsedTable)
        }
      } catch (error) {
        console.error('解析建表语句失败:', error)
        throw new Error(`解析建表语句失败: ${(error as Error).message}`)
      }
    }

    return tables
  }

  private splitStatements(): string[] {
    // 移除注释
    const sql = this.sql
      .replace(/--.*$/gm, '') // 移除单行注释
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
      .trim()

    // 按分号分割语句
    return sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.toLowerCase().startsWith('create table'))
  }

  private parseCreateTable(sql: string): ParsedTable | null {
    // 提取表名
    const tableNameMatch = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?[`"]?([^`"\s(]+)[`"]?\s*\(/i)
    if (!tableNameMatch) return null

    const tableName = tableNameMatch[1]
    const comment = this.extractTableComment(sql)

    // 提取字段和索引定义
    const bodyMatch = sql.match(/\(([\s\S]+)\)/i)
    if (!bodyMatch) return null

    const body = bodyMatch[1].trim()
    const lines = this.splitDefinitions(body)

    const fields: CreateFieldParams[] = []
    const indexes: CreateIndexParams[] = []
    let primaryKey: string[] = []

    // 第一遍：处理字段定义
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (this.isFieldDefinition(trimmedLine)) {
        const field = this.parseFieldDefinition(trimmedLine)
        if (field) {
          fields.push(field)
          // 如果字段定义中包含 PRIMARY KEY
          if (field.primaryKey) {
            primaryKey.push(field.name)
          }
        }
      }
    }

    // 第二遍：处理索引定义
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (this.isPrimaryKeyDefinition(trimmedLine)) {
        primaryKey = this.parsePrimaryKeyDefinition(trimmedLine)
      } else if (this.isIndexDefinition(trimmedLine)) {
        const index = this.parseIndexDefinition(trimmedLine)
        if (index) {
          indexes.push(index)
        }
      }
    }

    // 如果有主键定义，创建主键索引
    if (primaryKey.length > 0) {
      // 更新主键字段
      fields.forEach(field => {
        if (primaryKey.includes(field.name)) {
          field.primaryKey = true
          field.nullable = false
        }
      })

      // 添加主键索引
      indexes.push({
        name: 'PRIMARY',
        type: 'UNIQUE',
        comment: '主键索引',
        fields: primaryKey.map(name => ({
          fieldId: name,
          sort: 'ASC'
        })),
        disabled: false
      })
    }

    return {
      table: {
        name: tableName,
        comment
      },
      fields,
      indexes
    }
  }

  private extractTableComment(sql: string): string {
    // 匹配MySQL的表注释语法：COMMENT = '注释' 或 COMMENT '注释'
    const commentMatch = sql.match(/comment\s*=?\s*['"]([^'"]+)['"]/i)
    return commentMatch ? commentMatch[1] : ''
  }

  private splitDefinitions(body: string): string[] {
    const lines: string[] = []
    let current = ''
    let parentheses = 0
    let inString = false
    let stringChar = ''

    for (let i = 0; i < body.length; i++) {
      const char = body[i]

      if (char === "'" || char === '"' || char === '`') {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
        }
      } else if (char === '(' && !inString) {
        parentheses++
      } else if (char === ')' && !inString) {
        parentheses--
      } else if (char === ',' && !inString && parentheses === 0) {
        lines.push(current.trim())
        current = ''
        continue
      }

      current += char
    }

    if (current.trim()) {
      lines.push(current.trim())
    }

    return lines.filter(line => line.length > 0)
  }

  private isFieldDefinition(line: string): boolean {
    // 首先检查这一行是否是索引定义
    if (this.isIndexDefinition(line)) {
      return false
    }
    // 字段定义必须以标识符开头，后面跟着数据类型
    // 但不能以PRIMARY KEY, UNIQUE, KEY, INDEX等关键字开头
    const keywords = /^(primary\s+key|unique|key|index|fulltext|spatial)\s+/i
    if (keywords.test(line)) {
      return false
    }
    return /^[`"]?\w+[`"]?\s+\w+/.test(line)
  }

  private isIndexDefinition(line: string): boolean {
    return /^(?:primary\s+key|unique(?:\s+key|\s+index)?|key|index|fulltext(?:\s+key|\s+index)?|spatial(?:\s+key|\s+index)?)\s+/i.test(line)
  }

  private isPrimaryKeyDefinition(line: string): boolean {
    return /^primary\s+key\s*\(/i.test(line)
  }

  private parseFieldDefinition(line: string): CreateFieldParams | null {
    // 基本字段信息匹配
    const fieldMatch = line.match(/^[`"]?(\w+)[`"]?\s+(\w+)(?:\(([\d,]+)\))?(.*)$/i)
    if (!fieldMatch) return null

    const [, name, type, length, rest] = fieldMatch
    const upperType = type.toUpperCase()

    // 解析其他属性
    const nullable = !rest.toLowerCase().includes('not null')
    const autoIncrement = rest.toLowerCase().includes('auto_increment')
    const primaryKey = rest.toLowerCase().includes('primary key')
    
    // 改进默认值匹配
    const defaultMatch = rest.match(/default\s+(?:'([^']*)'|(\d+)|(\w+))/i)
    let defaultValue: string | undefined
    if (defaultMatch) {
      defaultValue = defaultMatch[1] !== undefined ? defaultMatch[1] : 
                    defaultMatch[2] !== undefined ? defaultMatch[2] :
                    defaultMatch[3]
    }
    
    const commentMatch = rest.match(/comment\s*['"]([^'"]+)['"]/i)

    // 解析精度和小数位
    let precision: number | undefined
    let scale: number | undefined
    if (length && (upperType === 'DECIMAL' || upperType === 'NUMERIC')) {
      const [p, s] = length.split(',').map(Number)
      precision = p
      scale = s
    }

    return {
      name,
      typeName: upperType,
      length: length && !precision ? parseInt(length) : undefined,
      precision,
      scale,
      nullable,
      primaryKey,
      autoIncrement,
      defaultValue,
      comment: commentMatch ? commentMatch[1] : undefined
    }
  }

  private parseIndexDefinition(line: string): CreateIndexParams | null {
    // 匹配不同类型的索引定义
    const indexMatch = line.match(/^(?:(primary\s+key|unique(?:\s+key|\s+index)?|fulltext(?:\s+key|\s+index)?|spatial(?:\s+key|\s+index)?)|(?:key|index))\s+(?:[`"]?(\w+)[`"]?\s*)?\(([^)]+)\)(?:\s+comment\s+['"]([^'"]+)['"])?/i)
    
    if (!indexMatch) return null

    const [, type, name, columns, comment] = indexMatch
    
    // 确定索引类型
    let indexType: 'UNIQUE' | 'NORMAL' | 'FULLTEXT' = 'NORMAL'
    if (type) {
      const upperType = type.toUpperCase()
      if (upperType.startsWith('PRIMARY') || upperType.startsWith('UNIQUE')) {
        indexType = 'UNIQUE'
      } else if (upperType.startsWith('FULLTEXT')) {
        indexType = 'FULLTEXT'
      }
    }
    
    // 解析索引字段
    const fields = columns.split(',').map(col => {
      const fieldMatch = col.trim().match(/[`"]?([^`"\s(]+)[`"]?(?:\s*\((\d+)\))?(?:\s+(ASC|DESC))?/i)
      if (!fieldMatch) return null
      
      const [, fieldName, , direction] = fieldMatch
      return {
        fieldId: fieldName,
        sort: direction ? direction.toUpperCase() as 'ASC' | 'DESC' : 'ASC'
      }
    }).filter((f): f is { fieldId: string; sort: 'ASC' | 'DESC' } => f !== null)

    // 生成索引名（如果没有指定）
    const indexName = name || (
      indexType === 'UNIQUE' ? `uk_${fields.map(f => f.fieldId).join('_')}` :
      indexType === 'FULLTEXT' ? `ft_${fields.map(f => f.fieldId).join('_')}` :
      `idx_${fields.map(f => f.fieldId).join('_')}`
    )

    return {
      name: indexName,
      type: indexType,
      comment: comment || '',
      fields,
      disabled: false
    }
  }

  private parsePrimaryKeyDefinition(line: string): string[] {
    const match = line.match(/^primary\s+key\s*\(([^)]+)\)/i)
    if (!match) return []

    return match[1]
      .split(',')
      .map(field => field.trim().replace(/[`"]/g, ''))
      .filter(Boolean)
  }
} 