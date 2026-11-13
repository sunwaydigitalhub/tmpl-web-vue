import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRouter, type RouteRecordNormalized } from 'vue-router'
import { sidebarGroups, sidebarSections } from '@/schemas/common'
import type {
  SidebarCounts,
  SidebarGroup,
  SidebarGroupKey,
  SidebarLink,
  SidebarSection,
  SidebarSectionKey,
} from '@/types/common'

// Stand-in for the backend: GET /me/sidebar-counts, one count per badge for the signed-in user.
// Replace it with the API call once the endpoint exists.
async function fetchSidebarCounts(): Promise<SidebarCounts> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return { exampleDrafts: 3 }
}

const collapsedKey = 'sidebarCollapsed'
const widthKey = 'sidebarWidth'

function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSetting(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage is blocked, so the choice lasts until the page closes.
  }
}

// True on the entry's own path and on any path below it. `/` only matches itself, since no path
// starts with `//`.
function isWithin(currentPath: string, entryPath: string) {
  return currentPath === entryPath || currentPath.startsWith(`${entryPath}/`)
}

interface Ordered<T> {
  order: number
  entry: T
}

// Ties fall back to the key, because getRoutes() lists routes by path rank, not declaration order.
function byOrder(a: Ordered<{ key: string }>, b: Ordered<{ key: string }>) {
  return a.order - b.order || a.entry.key.localeCompare(b.entry.key)
}

function append<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

// Builds the sidebar from the routes that set `meta.sidebar`. Sections and groups only appear while
// they hold an entry.
function buildSections(
  records: RouteRecordNormalized[],
  currentPath: string,
  counts: SidebarCounts,
): SidebarSection[] {
  const entries = records.flatMap((record) => {
    const meta = record.meta.sidebar
    // An alias shares its original's meta, so only the original gets an entry.
    if (!meta || record.aliasOf) return []
    // A link can't fill in params.
    if (record.path.includes(':')) {
      if (import.meta.env.DEV) console.warn(`No sidebar entry for ${record.path}: it has params.`)
      return []
    }
    return [{ record, meta }]
  })

  // When entries are nested by path, only the deepest one matching the current page is active.
  const activePath = entries
    .map(({ record }) => record.path)
    .filter((path) => isWithin(currentPath, path))
    .sort((a, b) => b.length - a.length)[0]

  const sectionEntries = new Map<SidebarSectionKey, Ordered<SidebarLink | SidebarGroup>[]>()
  const groupLinks = new Map<SidebarGroupKey, Ordered<SidebarLink>[]>()

  for (const { record, meta } of entries) {
    const link: SidebarLink = {
      kind: 'link',
      key: `route:${String(record.name ?? record.path)}`,
      labelKey: meta.labelKey,
      icon: meta.icon,
      to: record.name ? { name: record.name } : record.path,
      // A count of 0 shows no badge.
      count: (meta.badge && counts[meta.badge]) || undefined,
      active: record.path === activePath,
    }
    if (meta.group) append(groupLinks, meta.group, { order: meta.order, entry: link })
    else append(sectionEntries, meta.section, { order: meta.order, entry: link })
  }

  for (const [key, links] of groupLinks) {
    const group = sidebarGroups[key]
    append(sectionEntries, group.section, {
      order: group.order,
      entry: {
        kind: 'group',
        key: `group:${key}`,
        labelKey: group.labelKey,
        icon: group.icon,
        children: links.sort(byOrder).map(({ entry }) => entry),
        count: links.reduce((total, { entry }) => total + (entry.count ?? 0), 0) || undefined,
        active: links.some(({ entry }) => entry.active),
      },
    })
  }

  return [...sectionEntries]
    .sort(([a], [b]) => sidebarSections[a].order - sidebarSections[b].order)
    .map(([key, list]) => ({
      key,
      labelKey: sidebarSections[key].labelKey,
      entries: list.sort(byOrder).map(({ entry }) => entry),
    }))
}

// What the sidebar shows, built from the routes, plus its badge counts, collapsed state and width.
export const useSidebarStore = defineStore('sidebar', () => {
  const router = useRouter()
  const counts = ref<SidebarCounts>({})
  const collapsed = ref(readSetting(collapsedKey) === 'true')
  // Undefined until resized, so the sidebar starts at its own default width. BaseSidebar keeps
  // the width within its limits.
  const width = ref(Number(readSetting(widthKey)) || undefined)
  let latestRequest = 0

  // Follows navigation and count changes. getRoutes() isn't reactive, so a route added later with
  // router.addRoute() shows up on the next navigation.
  const sections = computed(() =>
    buildSections(router.getRoutes(), router.currentRoute.value.path, counts.value),
  )

  // Only the latest request's answer is kept. A failed request keeps the last counts, and the next
  // navigation asks again.
  async function refreshCounts() {
    const request = ++latestRequest
    try {
      const latest = await fetchSidebarCounts()
      if (request === latestRequest) counts.value = latest
    } catch {
      // Callers don't await this, so the error stops here.
    }
  }

  watch(collapsed, (value) => writeSetting(collapsedKey, String(value)))
  watch(width, (value) => {
    if (value !== undefined) writeSetting(widthKey, String(value))
  })

  return { sections, counts, collapsed, width, refreshCounts }
})
