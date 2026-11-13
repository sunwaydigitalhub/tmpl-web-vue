export type ExampleStatus = 'Active' | 'Draft' | 'Inactive'

export interface ExampleItem {
  id: number
  code: string
  name: string
  status: ExampleStatus
  description: string
}

// A draft without an id is a new record.
export type ExampleItemDraft = Omit<ExampleItem, 'id'> & { id?: number }
