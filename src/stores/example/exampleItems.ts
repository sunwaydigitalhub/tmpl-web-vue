import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ListingPage, ListingQuery } from '@/types/common'
import type { ExampleItem, ExampleItemDraft, ExampleStatus } from '@/types/example'

// Stand-in for the backend: hard-coded records behind functions shaped like the API endpoints.
// Replace the three endpoint functions with API calls once the module has a backend.
const sampleNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel']
const sampleStatuses: ExampleStatus[] = ['Active', 'Active', 'Draft', 'Inactive']

let records: ExampleItem[] = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  code: `EX-${String(index + 1).padStart(3, '0')}`,
  name: `${sampleNames[index % sampleNames.length]} ${Math.floor(index / sampleNames.length) + 1}`,
  status: sampleStatuses[index % sampleStatuses.length] ?? 'Active',
  description: '',
}))
let nextId = records.length + 1

const latency = () => new Promise((resolve) => setTimeout(resolve, 300))

// GET /example-items: the server searches, sorts and pages, and returns one page plus the total.
async function fetchExampleItems(
  query: ListingQuery<ExampleItem>,
): Promise<ListingPage<ExampleItem>> {
  await latency()
  const term = query.search.toLowerCase()
  const matches = records.filter((item) =>
    [item.code, item.name, item.status].some((value) => value.toLowerCase().includes(term)),
  )

  const { sortField, sortOrder } = query
  if (sortField) {
    const direction = sortOrder === 'desc' ? -1 : 1
    matches.sort(
      (a, b) =>
        direction *
        String(a[sortField]).localeCompare(String(b[sortField]), undefined, { numeric: true }),
    )
  }

  const start = (query.page - 1) * query.limit
  return {
    data: matches.slice(start, start + query.limit).map((item) => ({ ...item })),
    total: matches.length,
  }
}

// POST /example-items, or PUT /example-items/:id when the draft has an id.
async function saveExampleItem(draft: ExampleItemDraft) {
  await latency()
  if (draft.id === undefined) {
    records.push({ ...draft, id: nextId++ })
    return
  }
  records = records.map((item) => (item.id === draft.id ? { ...draft, id: item.id } : item))
}

// DELETE /example-items
async function deleteExampleItems(ids: number[]) {
  await latency()
  records = records.filter((item) => !ids.includes(item.id))
}

// The current page of the listing. Save and remove don't refetch; the page reloads after them.
export const useExampleItemsStore = defineStore('exampleItems', () => {
  const items = ref<ExampleItem[]>([])
  const totalRecords = ref(0)
  const loading = ref(false)
  let latestRequest = 0

  // Only the latest request's answer is kept, so a slow earlier page can't replace a newer one.
  async function fetchPage(query: ListingQuery<ExampleItem>) {
    const request = ++latestRequest
    loading.value = true
    try {
      const page = await fetchExampleItems(query)
      if (request !== latestRequest) return
      items.value = page.data
      totalRecords.value = page.total
    } finally {
      if (request === latestRequest) loading.value = false
    }
  }

  return {
    items,
    totalRecords,
    loading,
    fetchPage,
    save: saveExampleItem,
    remove: deleteExampleItems,
  }
})
