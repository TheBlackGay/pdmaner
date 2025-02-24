import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/tauri'
import type { 
  Table, 
  CreateTableParams, 
  UpdateTableParams,
  Field,
  CreateFieldParams,
  UpdateFieldParams
} from '@/types/table'

interface TableState {
  tables: Table[]
  selectedTable?: Table
  loading: boolean
  fetchTables: (projectId: string) => Promise<void>
  createTable: (projectId: string, params: CreateTableParams) => Promise<Table>
  updateTable: (tableId: string, params: UpdateTableParams) => Promise<void>
  deleteTable: (tableId: string) => Promise<void>
  selectTable: (table: Table) => void
  getTableWithFields: (tableId: string) => Promise<void>
  createField: (tableId: string, params: CreateFieldParams) => Promise<Field>
  updateField: (fieldId: string, params: UpdateFieldParams) => Promise<void>
  deleteField: (fieldId: string) => Promise<void>
  reorderFields: (tableId: string, fieldIds: string[]) => Promise<void>
}

export const useTableStore = create<TableState>((set, get) => ({
  tables: [],
  selectedTable: undefined,
  loading: false,

  fetchTables: async (projectId: string) => {
    set({ loading: true })
    try {
      const tables = await invoke<Table[]>('get_tables', { projectId })
      set({ tables })
    } catch (error) {
      console.error('Failed to fetch tables:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  createTable: async (projectId: string, params: CreateTableParams) => {
    try {
      const table = await invoke<Table>('create_table', { projectId, params })
      set(state => ({
        tables: [table, ...state.tables]
      }))
      return table
    } catch (error) {
      console.error('Failed to create table:', error)
      throw error
    }
  },

  updateTable: async (tableId: string, params: UpdateTableParams) => {
    try {
      const updatedTable = await invoke<Table>('update_table', { tableId, params })
      set(state => ({
        tables: state.tables.map(t => t.id === tableId ? { ...t, ...updatedTable } : t),
        selectedTable: state.selectedTable?.id === tableId 
          ? { ...state.selectedTable, ...updatedTable }
          : state.selectedTable
      }))
    } catch (error) {
      console.error('Failed to update table:', error)
      throw error
    }
  },

  deleteTable: async (tableId: string) => {
    try {
      await invoke('delete_table', { tableId })
      set(state => ({
        tables: state.tables.filter(t => t.id !== tableId),
        selectedTable: state.selectedTable?.id === tableId ? undefined : state.selectedTable
      }))
    } catch (error) {
      console.error('Failed to delete table:', error)
      throw error
    }
  },

  selectTable: (table: Table) => {
    set({ selectedTable: table })
  },

  getTableWithFields: async (tableId: string) => {
    try {
      const table = await invoke<Table>('get_table_with_fields', { tableId })
      set(state => ({
        tables: state.tables.map(t => t.id === tableId ? table : t),
        selectedTable: table
      }))
    } catch (error) {
      console.error('Failed to get table with fields:', error)
      throw error
    }
  },

  createField: async (tableId: string, params: CreateFieldParams) => {
    try {
      const field = await invoke<Field>('create_field', { tableId, params })
      set(state => {
        const selectedTable = state.selectedTable
        if (selectedTable?.id === tableId) {
          return {
            selectedTable: {
              ...selectedTable,
              fields: [...selectedTable.fields, field]
            }
          }
        }
        return state
      })
      return field
    } catch (error) {
      console.error('Failed to create field:', error)
      throw error
    }
  },

  updateField: async (fieldId: string, params: UpdateFieldParams) => {
    try {
      const updatedField = await invoke<Field>('update_field', { fieldId, params })
      set(state => {
        const selectedTable = state.selectedTable
        if (selectedTable) {
          return {
            selectedTable: {
              ...selectedTable,
              fields: selectedTable.fields.map(f => 
                f.id === fieldId ? { ...f, ...updatedField } : f
              )
            }
          }
        }
        return state
      })
    } catch (error) {
      console.error('Failed to update field:', error)
      throw error
    }
  },

  deleteField: async (fieldId: string) => {
    try {
      await invoke('delete_field', { fieldId })
      set(state => {
        const selectedTable = state.selectedTable
        if (selectedTable) {
          return {
            selectedTable: {
              ...selectedTable,
              fields: selectedTable.fields.filter(f => f.id !== fieldId)
            }
          }
        }
        return state
      })
    } catch (error) {
      console.error('Failed to delete field:', error)
      throw error
    }
  },

  reorderFields: async (tableId: string, fieldIds: string[]) => {
    try {
      await invoke('reorder_fields', { tableId, fieldIds })
      // 重新获取表和字段信息以确保顺序正确
      await get().getTableWithFields(tableId)
    } catch (error) {
      console.error('Failed to reorder fields:', error)
      throw error
    }
  }
})) 