<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, CircleChevronLeft } from '@lucide/vue'
import BaseSidebarLink from '@/components/common/BaseSidebarLink.vue'
import type { SidebarGroup, SidebarSection } from '@/types/common'

const props = withDefaults(
  defineProps<{
    sections: SidebarSection[]
    // Shows the collapse toggle. Off where the sidebar can't shrink, such as the mobile drawer.
    collapsible?: boolean
    // Lets people drag the right edge, or focus it and use the arrow keys, to set the width
    // (v-model:width). Double-clicking the edge goes back to defaultWidth. Widths are in pixels.
    resizable?: boolean
    minWidth?: number
    maxWidth?: number
    defaultWidth?: number
  }>(),
  { collapsible: true, resizable: false, minWidth: 240, maxWidth: 480, defaultWidth: 320 },
)

// Collapsed, the sidebar is a rail of icons with tooltips.
const collapsed = defineModel<boolean>('collapsed', { default: false })
// Undefined until someone resizes the sidebar, so it starts at defaultWidth.
const width = defineModel<number>('width')
const emit = defineEmits<{ navigate: [] }>()

defineSlots<{
  brand?: (props: { collapsed: boolean }) => unknown
}>()

const { t } = useI18n()
const id = useId()

const openGroups = ref(new Set<string>())

// The group holding the current page opens by itself. The route resolves after the first render,
// so this watches instead of running once on mount.
const activeGroupKey = computed(
  () =>
    props.sections
      .flatMap((section) => section.entries)
      .find((entry) => entry.kind === 'group' && entry.active)?.key,
)
watch(
  activeGroupKey,
  (key) => {
    if (key) openGroups.value.add(key)
  },
  { immediate: true },
)

function isOpen(group: SidebarGroup) {
  return !collapsed.value && openGroups.value.has(group.key)
}

function toggleGroup(group: SidebarGroup) {
  // The rail has no room for a group's pages, so opening one expands the sidebar.
  if (collapsed.value) {
    collapsed.value = false
    openGroups.value.add(group.key)
  } else if (openGroups.value.has(group.key)) {
    openGroups.value.delete(group.key)
  } else {
    openGroups.value.add(group.key)
  }
}

// Applied when showing the width too, since a saved width can predate the current limits.
function clampWidth(value: number) {
  return Math.min(props.maxWidth, Math.max(props.minWidth, Math.round(value)))
}

// Only set while dragging, so v-model:width changes once on release instead of on every move.
const dragWidth = ref<number>()
const currentWidth = computed(() =>
  clampWidth(dragWidth.value ?? width.value ?? props.defaultWidth),
)
let dragStart: { x: number; width: number } | undefined

function startResize(event: PointerEvent) {
  if (event.button !== 0) return
  // Keeps the drag from selecting page text.
  event.preventDefault()
  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture(event.pointerId)
  dragStart = { x: event.clientX, width: currentWidth.value }
}

function moveResize(event: PointerEvent) {
  if (dragStart) dragWidth.value = clampWidth(dragStart.width + event.clientX - dragStart.x)
}

// Runs when the pointer is released and when the browser cancels the drag.
function endResize() {
  if (dragWidth.value !== undefined) width.value = dragWidth.value
  dragWidth.value = undefined
  dragStart = undefined
}

const resizeKeys: Record<string, (current: number) => number> = {
  ArrowLeft: (current) => current - 16,
  ArrowRight: (current) => current + 16,
  Home: () => props.minWidth,
  End: () => props.maxWidth,
}

function resizeWithKey(event: KeyboardEvent) {
  const next = resizeKeys[event.key]
  if (!next) return
  event.preventDefault()
  width.value = clampWidth(next(currentWidth.value))
}
</script>

<template>
  <div
    :id="`${id}-sidebar`"
    class="sidebar"
    :class="{ collapsed, resizing: dragWidth !== undefined }"
    :style="resizable ? { '--sidebar-width': `${currentWidth}px` } : undefined"
  >
    <div v-if="$slots.brand || collapsible" class="header">
      <div class="brand">
        <slot name="brand" :collapsed="collapsed" />
      </div>
      <!-- One button for both states, so focus stays on it when the sidebar resizes. -->
      <Button
        v-if="collapsible"
        text
        rounded
        severity="secondary"
        :aria-label="collapsed ? t('common.sidebar.expand') : t('common.sidebar.collapse')"
        :aria-expanded="!collapsed"
        :aria-controls="`${id}-nav`"
        @click="collapsed = !collapsed"
      >
        <template #icon>
          <CircleChevronLeft class="toggle-icon" :size="22" />
        </template>
      </Button>
    </div>

    <nav :id="`${id}-nav`" class="nav" :aria-label="t('common.sidebar.label')">
      <div v-for="section in sections" :key="section.key" class="section">
        <div
          :id="`${id}-${section.key}`"
          class="section-title"
          :class="{ 'visually-hidden': collapsed }"
        >
          {{ t(section.labelKey) }}
        </div>
        <ul class="list" :aria-labelledby="`${id}-${section.key}`">
          <li v-for="entry in section.entries" :key="entry.key">
            <BaseSidebarLink
              v-if="entry.kind === 'link'"
              :link="entry"
              :collapsed="collapsed"
              @navigate="emit('navigate')"
            />
            <template v-else>
              <button
                v-tooltip.right="{ value: t(entry.labelKey), disabled: !collapsed }"
                type="button"
                class="group-toggle"
                :class="{ active: entry.active }"
                :aria-expanded="isOpen(entry)"
                :aria-controls="`${id}-${entry.key}`"
                @click="toggleGroup(entry)"
              >
                <span class="group-icon">
                  <!-- The rail hides the group's pages, so their total count sits on its icon. -->
                  <OverlayBadge
                    v-if="collapsed && entry.count"
                    :value="entry.count"
                    :severity="entry.active ? undefined : 'secondary'"
                    size="small"
                  >
                    <component :is="entry.icon" :size="20" />
                  </OverlayBadge>
                  <component :is="entry.icon" v-else :size="20" />
                </span>
                <span class="group-label" :class="{ 'visually-hidden': collapsed }">
                  {{ t(entry.labelKey) }}
                </span>
                <ChevronDown v-if="!collapsed" class="group-chevron" :size="18" />
              </button>
              <ul v-show="isOpen(entry)" :id="`${id}-${entry.key}`" class="list sublist">
                <li v-for="child in entry.children" :key="child.key">
                  <BaseSidebarLink :link="child" :collapsed="false" @navigate="emit('navigate')" />
                </li>
              </ul>
            </template>
          </li>
        </ul>
      </div>
    </nav>

    <!-- The WAI-ARIA window splitter: drag it, or focus it and use the arrow keys, Home and End.
         A focusable separator counts as a widget, so its role and tabindex are deliberate. -->
    <div
      v-if="resizable && !collapsed"
      class="resize-handle"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      :aria-label="t('common.sidebar.resize')"
      :aria-controls="`${id}-sidebar`"
      :aria-valuenow="currentWidth"
      :aria-valuemin="minWidth"
      :aria-valuemax="maxWidth"
      @pointerdown="startResize"
      @pointermove="moveResize"
      @lostpointercapture="endResize"
      @keydown="resizeWithKey"
      @dblclick="width = defaultWidth"
    />
  </div>
</template>

<style scoped>
.sidebar {
  /* Shared with BaseSidebarLink, so links and group headers line up. */
  --sidebar-row-gap: 0.75rem;
  --sidebar-row-padding: 0.625rem 0.75rem;
  --sidebar-row-radius: var(--p-border-radius-md);
  --sidebar-icon-size: 20px;

  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width, 20rem);
  height: 100%;
  background: var(--p-content-background);
  color: var(--p-text-color);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width, 4.5rem);
}

/* The width follows the pointer directly while dragging. */
.sidebar.resizing {
  transition: none;
}

/* Straddles the right edge. Shows as a line when hovered, focused or dragged. */
.resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
  bottom: 0;
  z-index: 1;
  width: 8px;
  cursor: col-resize;
  touch-action: none;
}

.resize-handle::after {
  content: '';
  position: absolute;
  inset: 0 3px;
}

.resize-handle:hover::after,
.resize-handle:focus-visible::after,
.resizing .resize-handle::after {
  background: var(--p-primary-color);
}

.resize-handle:focus-visible {
  outline: none;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1.5rem 1rem 1.25rem 1.5rem;
  border-bottom: 1px solid var(--p-content-border-color);
}

.collapsed .header {
  justify-content: center;
  padding-inline: 0;
}

.brand {
  min-width: 0;
}

.collapsed .toggle-icon {
  transform: rotate(180deg);
}

.nav {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1rem;
}

.collapsed .nav {
  padding-inline: 0.75rem;
}

.section + .section {
  margin-top: 1.5rem;
}

/* The rail has no room for headings, so a rule separates the sections instead. */
.collapsed .section + .section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--p-content-border-color);
}

.section-title {
  padding: 0 0.75rem 0.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Lines a group's pages up under the group's label. */
.sublist {
  margin-top: 0.25rem;
  padding-left: calc(var(--sidebar-icon-size) + var(--sidebar-row-gap));
}

.group-toggle {
  display: flex;
  align-items: center;
  gap: var(--sidebar-row-gap);
  width: 100%;
  padding: var(--sidebar-row-padding);
  border: 0;
  border-radius: var(--sidebar-row-radius);
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
}

.group-toggle:hover {
  background: var(--p-content-hover-background);
}

.group-toggle:focus-visible {
  outline: var(--p-focus-ring-width) var(--p-focus-ring-style) var(--p-focus-ring-color);
  outline-offset: calc(-1 * var(--p-focus-ring-width));
}

.collapsed .group-toggle {
  justify-content: center;
  padding-inline: 0;
}

/* Expanded, the current page itself is highlighted. In the rail only its group's icon shows. */
.collapsed .group-toggle.active {
  color: var(--p-highlight-color);
  background: var(--p-highlight-background);
}

.group-icon {
  display: flex;
  flex-shrink: 0;
}

.group-chevron {
  flex-shrink: 0;
}

.group-label {
  flex: 1;
  min-width: 0;
}

.group-toggle[aria-expanded='true'] .group-chevron {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: no-preference) {
  .sidebar {
    transition: width 0.2s ease;
  }

  .toggle-icon,
  .group-chevron {
    transition: transform 0.2s ease;
  }

  .resize-handle::after {
    transition: background-color 0.15s;
  }
}
</style>
