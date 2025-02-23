export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectParams {
  name: string
  description?: string
  template?: string
  database: {
    type: 'MySQL' | 'PostgreSQL' | 'Oracle' | 'SQLServer'
    version?: string
  }
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnail?: string
  tableCount: number
} 