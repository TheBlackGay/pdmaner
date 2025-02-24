export interface Table {
  id: string
  name: string
  comment?: string
  fields: Field[]
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