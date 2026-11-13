import { computed, shallowRef, watch, type WritableComputedRef } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { listingPageLimits } from '@/schemas/common'
import type { ListingColumn, ListingQuery } from '@/types/common'

// One value of a query parameter. A URL can repeat a parameter or give it no value.
function single(value: LocationQuery[string] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value
  return first ?? undefined
}

// The URL's page, page size, search and sort. A part the table couldn't have set, such as a page size
// it doesn't offer or a column it can't sort, falls back to the default.
function parseListingQuery<T>(
  query: LocationQuery,
  defaults: ListingQuery<T>,
  sortFields: (keyof T & string)[],
): ListingQuery<T> {
  const page = Number(single(query.page))
  const limit = Number(single(query.limit))
  const sortField = sortFields.find((field) => field === single(query.sortField))
  const sortOrder = single(query.sortOrder)
  const sorted = sortField !== undefined && (sortOrder === 'asc' || sortOrder === 'desc')
  return {
    page: Number.isInteger(page) && page > 0 ? page : defaults.page,
    limit: listingPageLimits.includes(limit) ? limit : defaults.limit,
    search: single(query.search) ?? defaults.search,
    sortField: sorted ? sortField : defaults.sortField,
    sortOrder: sorted ? sortOrder : defaults.sortOrder,
  }
}

// The parts that differ from the defaults, so a list as it first opens keeps a bare URL.
function toLocationQuery<T>(value: ListingQuery<T>, defaults: ListingQuery<T>): LocationQueryRaw {
  const defaultSort =
    value.sortField === defaults.sortField && value.sortOrder === defaults.sortOrder
  return {
    page: value.page === defaults.page ? undefined : value.page,
    limit: value.limit === defaults.limit ? undefined : value.limit,
    search: value.search === defaults.search ? undefined : value.search,
    sortField: defaultSort ? undefined : value.sortField,
    sortOrder: defaultSort ? undefined : value.sortOrder,
  }
}

// A listing's page, page size, search and sort, kept in the URL (?page=2&search=sunway) rather than
// in the page, so Back, a reload and the breadcrumb all return to them. Use it as the listing's
// query ref: bind it with v-model:query and watch it to fetch. The URL can sort only by the columns
// marked sortable.
export function useListingQuery<T>(
  defaults: ListingQuery<T>,
  columns: ListingColumn<T>[] = [],
): WritableComputedRef<ListingQuery<T>> {
  const route = useRoute()
  const router = useRouter()
  const sortFields = columns.filter((column) => column.sortable).map((column) => column.field)
  const read = () => parseListingQuery(route.query, defaults, sortFields)

  // Leaving the page changes the URL too, so only the listing's own path is read, and the page
  // doesn't fetch again on its way out.
  const listingPath = route.path
  const query = shallowRef(read())
  watch(
    () => route.query,
    () => {
      if (route.path === listingPath) query.value = read()
    },
  )

  return computed({
    get: () => query.value,
    // Replaces the history entry rather than adding one, so Back leaves the list instead of stepping
    // back through its pages and searches.
    set: (value) => {
      if (route.path !== listingPath) return
      router.replace({ query: { ...route.query, ...toLocationQuery(value, defaults) } })
    },
  })
}
