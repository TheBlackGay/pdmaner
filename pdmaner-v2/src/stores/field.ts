import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/tauri'
import type { Field, CreateFieldParams, UpdateFieldParams } from '@/types/table'

interface FieldStore {
  createField: (tableId: string, params: CreateFieldParams) => Promise<Field>
  updateField: (fieldId: string, params: UpdateFieldParams) => Promise<Field>
  deleteField: (fieldId: string) => Promise<void>
}

export const useFieldStore = create<FieldStore>((set) => ({
  createField: async (tableId: string, params: CreateFieldParams) => {
    const field = await invoke<Field>('create_field', { tableId, params })
    return field
  },

  updateField: async (fieldId: string, params: UpdateFieldParams) => {
    const field = await invoke<Field>('update_field', { fieldId, params })
    return field
  },

  deleteField: async (fieldId: string) => {
    await invoke('delete_field', { fieldId })
  }
})) 