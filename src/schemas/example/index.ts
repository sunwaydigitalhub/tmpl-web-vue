import type { MessageKey } from '@/locales'
import type { ListingColumn } from '@/types/common'
import type { ExampleItem, ExampleStatus } from '@/types/example'

// Records keep the English status value; only the label shown is translated.
export const exampleStatusLabels: Record<ExampleStatus, MessageKey> = {
  Active: 'example.status.active',
  Draft: 'example.status.draft',
  Inactive: 'example.status.inactive',
}

// Columns of the example listing, in display order.
export const exampleItemColumns: ListingColumn<ExampleItem>[] = [
  { field: 'code', headerKey: 'example.fields.code', sortable: true },
  { field: 'name', headerKey: 'example.fields.name', sortable: true },
  {
    field: 'status',
    headerKey: 'example.fields.status',
    sortable: true,
    display: {
      type: 'tag',
      rounded: true,
      severity: { Active: 'success', Draft: 'warn', Inactive: 'secondary' },
      labels: exampleStatusLabels,
    },
  },
]
