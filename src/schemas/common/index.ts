import type { Component } from 'vue'
import { Settings } from '@lucide/vue'
import type { MessageKey } from '@/locales'
import type { SidebarGroupKey, SidebarSectionKey } from '@/types/common'

// Section headings, in display order. Pages join a section through their route's `meta.sidebar`;
// a section with no visible entry is hidden.
export const sidebarSections: Record<SidebarSectionKey, { labelKey: MessageKey; order: number }> = {
  workspace: { labelKey: 'common.sidebar.sections.workspace', order: 10 },
  admin: { labelKey: 'common.sidebar.sections.admin', order: 20 },
}

// Groups are declared here rather than in a module's routes, because one group can hold pages from
// several modules.
export const sidebarGroups: Record<
  SidebarGroupKey,
  { section: SidebarSectionKey; labelKey: MessageKey; icon: Component; order: number }
> = {
  example: {
    section: 'admin',
    labelKey: 'common.sidebar.groups.example',
    icon: Settings,
    order: 10,
  },
}

// The page sizes a listing offers unless its table is given others. useListingQuery takes only
// these from a URL.
export const listingPageLimits = [10, 50, 100]
