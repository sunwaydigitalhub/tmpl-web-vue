import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { MessageKey } from '@/locales'

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'

// How a listing cell shows its value. Without `display`, the raw value is shown as text.
export type ColumnDisplay<V, T> =
  | { type: 'text'; format?: (value: V, row: T) => string }
  // `severity` and `labels` must map every value of the field, so adding a status fails type-check
  // until it is styled and labelled.
  | {
      type: 'tag'
      severity: Record<`${V & (string | number | boolean)}`, TagSeverity>
      labels: Record<`${V & (string | number | boolean)}`, MessageKey>
      rounded?: boolean
    }
  | { type: 'date'; options?: Intl.DateTimeFormatOptions }
  | { type: 'number'; options?: Intl.NumberFormatOptions }

interface ColumnOf<T, K extends keyof T & string> {
  field: K
  headerKey: MessageKey
  sortable?: boolean
  display?: ColumnDisplay<T[K], T>
}

// One listing column. `field` is checked against the row type, so renaming a field fails type-check,
// and `display` is checked against that field's own type. Message keys are checked against the
// English messages, so a misspelt key fails type-check too.
export type ListingColumn<T> = { [K in keyof T & string]: ColumnOf<T, K> }[keyof T & string]

// What a listing asks the API for. `page` is 1-based, like most paged endpoints.
export interface ListingQuery<T> {
  page: number
  limit: number
  search: string
  sortField?: keyof T & string
  sortOrder?: 'asc' | 'desc'
}

// One page of a listing as the API returns it: the rows, plus the total across all pages.
export interface ListingPage<T> {
  data: T[]
  total: number
}

// Sidebar sections and groups. A new key also needs its heading in src/schemas/common, which
// fails type-check until it has one.
export type SidebarSectionKey = 'workspace' | 'admin'
export type SidebarGroupKey = 'example'

// One per count the sidebar counts endpoint returns.
export type SidebarBadgeKey = 'exampleDrafts'
export type SidebarCounts = Partial<Record<SidebarBadgeKey, number>>

// What a route sets as `meta.sidebar` to get a sidebar entry. A top-level entry names its section
// and an icon; an entry inside a group names the group and has no icon. Mixing the two fails
// type-check.
export type SidebarMeta = {
  labelKey: MessageKey
  // Lower comes first within the section or group.
  order: number
  badge?: SidebarBadgeKey
} & (
  | { section: SidebarSectionKey; icon: Component; group?: never }
  | { group: SidebarGroupKey; section?: never; icon?: never }
)

// The sidebar as BaseSidebar draws it. The sidebar store builds it from the routes.
export interface SidebarLink {
  kind: 'link'
  key: string
  labelKey: MessageKey
  icon?: Component
  to: RouteLocationRaw
  count?: number
  active: boolean
}

export interface SidebarGroup {
  kind: 'group'
  key: string
  labelKey: MessageKey
  icon: Component
  children: SidebarLink[]
  // The children's counts added up, for the rail, where the children are hidden.
  count?: number
  active: boolean
}

export interface SidebarSection {
  key: string
  labelKey: MessageKey
  entries: (SidebarLink | SidebarGroup)[]
}

// What a route sets as `meta.breadcrumb` to name its page in the breadcrumb. A page with a sidebar
// entry can leave it out: its sidebar label names it there too.
export interface BreadcrumbMeta {
  labelKey: MessageKey
}

// One step of the breadcrumb as BaseBreadcrumb draws it. The breadcrumb store builds the steps from
// the routes; the current page comes last and has no link.
export interface BreadcrumbEntry {
  key: string
  labelKey: MessageKey
  to?: RouteLocationRaw
}

declare module 'vue-router' {
  interface RouteMeta {
    sidebar?: SidebarMeta
    breadcrumb?: BreadcrumbMeta
  }
}
