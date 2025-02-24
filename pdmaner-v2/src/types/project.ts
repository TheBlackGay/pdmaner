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