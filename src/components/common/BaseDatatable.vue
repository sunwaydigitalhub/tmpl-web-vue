<script setup lang="ts" generic="T extends object">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable'
import type { MessageKey } from '@/locales'
import { listingPageLimits } from '@/schemas/common'
import type { ListingColumn, ListingQuery, TagSeverity } from '@/types/common'

withDefaults(
  defineProps<{
    value: T[]
    columns: ListingColumn<T>[]
    dataKey: keyof T & string
    // Records across all pages, from the API.
    totalRecords: number
    loading?: boolean
    pageLimits?: number[]
    searchable?: boolean
    // Adds a checkbox column before the schema columns; bind v-model:selection to get the ticked rows.
    selectable?: boolean
    resizable?: boolean
    // Defaults to the translated "No records found."
    emptyMessage?: string
  }>(),
  {
    loading: false,
    pageLimits: () => [...listingPageLimits],
    searchable: true,
    selectable: false,
    resizable: false,
  },
)

// The API pages, sorts and searches: the table only edits the query, and the page fetches on change.
const query = defineModel<ListingQuery<T>>('query', { required: true })
const selection = defineModel<T[]>('selection', { default: () => [] })

const { t } = useI18n()

// `cell-<field>` replaces a column's schema display, for cells a schema can't describe (links, buttons).
defineSlots<
  {
    toolbar?: () => unknown
    actions?: (props: { data: T }) => unknown
  } & {
    [K in keyof T & string as `cell-${K}`]?: (props: { data: T; value: T[K] }) => unknown
  }
>()

const first = computed(() => (query.value.page - 1) * query.value.limit)
const sortOrders = { asc: 1, desc: -1 } as const
const sortOrder = computed(() => query.value.sortOrder && sortOrders[query.value.sortOrder])

// PrimeVue fills in these placeholders itself, so they pass through the translation unchanged.
const pageReport = computed(() =>
  t('common.listing.pageReport', {
    first: '{first}',
    last: '{last}',
    totalRecords: '{totalRecords}',
  }),
)

function onPage(event: DataTablePageEvent) {
  query.value = { ...query.value, page: event.page + 1, limit: event.rows }
}

// A new sort starts again from the first page.
function onSort(event: DataTableSortEvent) {
  query.value = {
    ...query.value,
    page: 1,
    sortField:
      typeof event.sortField === 'string' ? (event.sortField as keyof T & string) : undefined,
    sortOrder: event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : undefined,
  }
}

// Searches once typing pauses, so the API isn't called on every keystroke. A new search starts again
// from the first page.
const search = ref(query.value.search)
let searchTimer: ReturnType<typeof setTimeout> | undefined
// The term last sent, so the box can tell its own search coming back from a change made elsewhere.
let sentTerm = query.value.search
watch(search, (term) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (term.trim() === query.value.search) return
    sentTerm = term.trim()
    query.value = { ...query.value, page: 1, search: sentTerm }
  }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

// The query can also change from outside, such as a link back to the list without its search, and
// the box follows. Its own search coming back is left alone, so a slow round trip can't undo typing.
watch(
  () => query.value.search,
  (term) => {
    if (term === sentTerm) return
    sentTerm = term
    search.value = term
  },
)

function cellText(column: ListingColumn<T>, row: T): string {
  const value = row[column.field]
  const display = column.display
  if (display?.type === 'text' && display.format) return display.format(value, row)
  if (value === null || value === undefined || value === '') return ''

  switch (display?.type) {
    case 'tag': {
      const labels: Partial<Record<string, MessageKey>> = display.labels
      const key = labels[String(value)]
      return key ? t(key) : String(value)
    }
    case 'date': {
      const date = new Date(value as string | number | Date)
      if (Number.isNaN(date.getTime())) return String(value)
      return date.toLocaleString(undefined, display.options ?? { dateStyle: 'medium' })
    }
    case 'number':
      return Number(value).toLocaleString(undefined, display.options)
    default:
      return String(value)
  }
}

function tagSeverity(column: ListingColumn<T>, row: T): TagSeverity | undefined {
  if (column.display?.type !== 'tag') return undefined
  const severity: Partial<Record<string, TagSeverity>> = column.display.severity
  return severity[String(row[column.field])]
}
</script>

<template>
  <DataTable
    v-model:selection="selection"
    :value="value"
    :dataKey="dataKey"
    lazy
    :totalRecords="totalRecords"
    :first="first"
    :rows="query.limit"
    :sortField="query.sortField"
    :sortOrder="sortOrder"
    :loading="loading"
    paginator
    :rowsPerPageOptions="pageLimits"
    paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
    :currentPageReportTemplate="pageReport"
    :resizableColumns="resizable"
    columnResizeMode="fit"
    size="small"
    stripedRows
    @page="onPage"
    @sort="onSort"
  >
    <template v-if="searchable || $slots.toolbar" #header>
      <div class="toolbar">
        <InputText
          v-if="searchable"
          v-model="search"
          :placeholder="t('common.listing.search')"
          :aria-label="t('common.listing.searchLabel')"
          size="small"
        />
        <div class="toolbar-actions">
          <slot name="toolbar" />
        </div>
      </div>
    </template>
    <template #empty>{{ emptyMessage ?? t('common.listing.empty') }}</template>

    <Column v-if="selectable" selectionMode="multiple" headerStyle="width: 3rem" />
    <Column
      v-for="column in columns"
      :key="column.field"
      :field="column.field"
      :header="t(column.headerKey)"
      :sortable="column.sortable"
    >
      <template #body="{ data }">
        <slot :name="`cell-${column.field}`" :data="data" :value="data[column.field]">
          <Tag
            v-if="column.display?.type === 'tag'"
            :value="cellText(column, data)"
            :severity="tagSeverity(column, data)"
            :rounded="column.display.rounded"
          />
          <template v-else>{{ cellText(column, data) }}</template>
        </slot>
      </template>
    </Column>
    <Column v-if="$slots.actions" :header="t('common.listing.actions')">
      <template #body="{ data }">
        <div class="row-actions">
          <slot name="actions" :data="data" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

/* Keeps toolbar buttons on the right when the search box is hidden. */
.toolbar-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}
</style>
