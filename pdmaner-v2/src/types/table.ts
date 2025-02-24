export interface Table {
  id: string
  name: string
  comment?: string
  fields: Field[]
  indexes: Index[]
  createdAt: string
  updatedAt: string
}

export interface Field {
  id: string
  name: string
  comment?: string
  typeName: string
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
  defaultValue?: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface CreateTableParams {
  name: string
  comment?: string
}

export interface UpdateTableParams {
  name: string
  comment?: string
}

export interface CreateFieldParams {
  name: string
  comment?: string
  typeName: string
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
  defaultValue?: string
}

export interface UpdateFieldParams {
  name: string
  comment?: string
  typeName: string
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
  defaultValue?: string
}

export type DataType = {
  name: string
  type: string
  hasLength: boolean
  hasPrecision: boolean
  hasScale: boolean
  defaultLength?: number
  defaultPrecision?: number
  defaultScale?: number
}

export const DATA_TYPES: DataType[] = [
  {
    name: 'VARCHAR',
    type: 'string',
    hasLength: true,
    hasPrecision: false,
    hasScale: false,
    defaultLength: 255
  },
  {
    name: 'CHAR',
    type: 'string',
    hasLength: true,
    hasPrecision: false,
    hasScale: false,
    defaultLength: 1
  },
  {
    name: 'TEXT',
    type: 'string',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'INT',
    type: 'number',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'BIGINT',
    type: 'number',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'DECIMAL',
    type: 'number',
    hasLength: false,
    hasPrecision: true,
    hasScale: true,
    defaultPrecision: 10,
    defaultScale: 2
  },
  {
    name: 'FLOAT',
    type: 'number',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'DOUBLE',
    type: 'number',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'BOOLEAN',
    type: 'boolean',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'DATE',
    type: 'date',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'TIME',
    type: 'time',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'DATETIME',
    type: 'datetime',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  },
  {
    name: 'TIMESTAMP',
    type: 'timestamp',
    hasLength: false,
    hasPrecision: false,
    hasScale: false
  }
]

export interface Index {
  id: string
  name: string
  type: IndexType
  comment?: string
  fields: IndexField[]
  disabled?: boolean
  createdAt: string
  updatedAt: string
}

export interface IndexField {
  id: string
  fieldId: string
  orderIndex: number
  field: Field
  sort?: 'ASC' | 'DESC'
  length?: number
}

export type IndexType = 'UNIQUE' | 'NORMAL' | 'FULLTEXT' | 'SPATIAL'

export interface CreateIndexParams {
  name: string
  type: IndexType
  comment?: string
  fields: {
    fieldId: string
    sort?: 'ASC' | 'DESC'
  }[]
  disabled: boolean
}

export interface UpdateIndexParams {
  name: string
  type: IndexType
  comment?: string
  fields: {
    fieldId: string
    sort?: 'ASC' | 'DESC'
  }[]
  disabled: boolean
}

export interface TableStore {
  tables: Table[]
  selectedTable: Table | null
  loading: boolean
  getTables: () => Promise<void>
  getTableWithFields: (tableId: string) => Promise<void>
  createTable: (params: CreateTableParams) => Promise<void>
  updateTable: (tableId: string, params: UpdateTableParams) => Promise<void>
  deleteTable: (tableId: string) => Promise<void>
  createField: (tableId: string, params: CreateFieldParams) => Promise<void>
  updateField: (fieldId: string, params: UpdateFieldParams) => Promise<void>
  deleteField: (fieldId: string) => Promise<void>
  createIndex: (params: CreateIndexParams) => Promise<void>
  updateIndex: (params: UpdateIndexParams) => Promise<void>
  deleteIndex: (indexId: string) => Promise<void>
  setSelectedTable: (table: Table | null) => void
}
