import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/tauri'
import type { Project, CreateProjectParams } from '@/types/project'

interface ProjectState {
  projects: Project[]
  loading: boolean
  selectedProject?: Project
  fetchProjects: () => Promise<void>
  createProject: (params: CreateProjectParams) => Promise<Project>
  selectProject: (project: Project) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  selectedProject: undefined,

  fetchProjects: async () => {
    set({ loading: true })
    try {
      const projects = await invoke<Project[]>('get_projects')
      set({ projects })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      set({ loading: false })
    }
  },

  createProject: async (params: CreateProjectParams) => {
    try {
      const project = await invoke<Project>('create_project', { params })
      set(state => ({
        projects: [project, ...state.projects]
      }))
      return project
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  },

  selectProject: (project: Project) => {
    set({ selectedProject: project })
  }
})) 