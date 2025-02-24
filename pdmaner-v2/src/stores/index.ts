import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/tauri'
import type { Index, CreateIndexParams, UpdateIndexParams } from '@/types/table'

interface IndexStore {
  createIndex: (tableId: string, params: CreateIndexParams) => Promise<Index>
  updateIndex: (indexId: string, params: UpdateIndexParams) => Promise<Index>
  deleteIndex: (indexId: string) => Promise<void>
}

export const useIndexStore = create<IndexStore>((set) => ({
  createIndex: async (tableId: string, params: CreateIndexParams) => {
    const index = await invoke<Index>('create_index', { tableId, params })
    return index
  },

  updateIndex: async (indexId: string, params: UpdateIndexParams) => {
    const index = await invoke<Index>('update_index', { indexId, params })
    return index
  },

  deleteIndex: async (indexId: string) => {
    await invoke('delete_index', { indexId })
  }
})) 