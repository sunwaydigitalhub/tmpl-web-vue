import { computed, shallowReactive, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  useRouter,
  type LocationQuery,
  type RouteLocationNormalizedLoaded,
  type RouteRecordNormalized,
} from 'vue-router'
import type { MessageKey } from '@/locales'
import type { BreadcrumbEntry } from '@/types/common'

// A page's name in the breadcrumb: its own label, else its sidebar entry's.
function labelOf(record: RouteRecordNormalized): MessageKey | undefined {
  return record.meta.breadcrumb?.labelKey ?? record.meta.sidebar?.labelKey
}

// The steps to the current page, following the URL's own hierarchy as the sidebar does. Every
// shorter prefix of the page's path pattern that is itself a labelled page becomes a step, linked to
// the same prefix of the current URL, so its params are already filled in: on
// /intellectual-property/42/edit, the page /intellectual-property/:requestId links to
// /intellectual-property/42. A link takes back the query its page was left with, so a list opens on
// the page and search it had.
function buildTrail(
  records: RouteRecordNormalized[],
  route: RouteLocationNormalizedLoaded,
  queries: Map<string, LocationQuery>,
): BreadcrumbEntry[] {
  // The page's own record, not the parents it is nested in.
  const page = route.matched.at(-1)
  const pageLabel = page && labelOf(page)
  if (!page || !pageLabel) return []

  // Labelled pages by path pattern. An alias shares its original's meta, so only the original counts.
  const labels = new Map<string, MessageKey>()
  for (const record of records) {
    const labelKey = labelOf(record)
    if (labelKey && !record.aliasOf) labels.set(record.path, labelKey)
  }

  const pattern = page.path.split('/')
  const segments = route.path.split('/')
  const trail: BreadcrumbEntry[] = []

  // Starts after the root, so Home is never a step.
  for (let length = 2; length < pattern.length; length++) {
    const ancestor = pattern.slice(0, length).join('/')
    const labelKey = labels.get(ancestor)
    if (!labelKey) continue
    const path = segments.slice(0, length).join('/')
    trail.push({ key: ancestor, labelKey, to: { path, query: queries.get(path) } })
  }

  trail.push({ key: page.path, labelKey: pageLabel })
  return trail
}

// The breadcrumb, built from the routes, and the query each visited page was last left with.
export const useBreadcrumbStore = defineStore('breadcrumb', () => {
  const router = useRouter()
  // By path, since the app loaded. A page left without a query has no entry.
  const queries = shallowReactive(new Map<string, LocationQuery>())

  // Every navigation counts, including a list replacing its own query as it pages and searches.
  watch(
    router.currentRoute,
    (route) => {
      if (Object.keys(route.query).length) queries.set(route.path, route.query)
      else queries.delete(route.path)
    },
    { immediate: true },
  )

  // Follows navigation. getRoutes() isn't reactive, so a route added later with router.addRoute()
  // shows up on the next navigation.
  const trail = computed(() => buildTrail(router.getRoutes(), router.currentRoute.value, queries))

  return { trail }
})
