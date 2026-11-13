<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SidebarLink } from '@/types/common'

defineProps<{
  link: SidebarLink
  // In the icon rail the label is visually hidden and shown as a tooltip instead.
  collapsed: boolean
}>()
const emit = defineEmits<{ navigate: [] }>()

const { t } = useI18n()
</script>

<template>
  <RouterLink
    v-tooltip.right="{ value: t(link.labelKey), disabled: !collapsed }"
    :to="link.to"
    class="sidebar-link"
    :class="{ active: link.active, collapsed }"
    @click="emit('navigate')"
  >
    <span v-if="link.icon" class="icon">
      <!-- In the rail the count sits on the icon. Only one badge renders, so it is read once. -->
      <OverlayBadge
        v-if="collapsed && link.count"
        :value="link.count"
        :severity="link.active ? undefined : 'secondary'"
        size="small"
      >
        <component :is="link.icon" :size="20" />
      </OverlayBadge>
      <component :is="link.icon" v-else :size="20" />
    </span>
    <span class="label" :class="{ 'visually-hidden': collapsed }">{{ t(link.labelKey) }}</span>
    <Badge
      v-if="!collapsed && link.count"
      class="count"
      :value="link.count"
      :severity="link.active ? undefined : 'secondary'"
    />
  </RouterLink>
</template>

<style scoped>
/* Colour, padding, background and transition are all set here, so main.css's global link rules
   don't show through. Sizes come from BaseSidebar, so links line up with group headers. */
.sidebar-link {
  display: flex;
  align-items: center;
  gap: var(--sidebar-row-gap);
  padding: var(--sidebar-row-padding);
  border-radius: var(--sidebar-row-radius);
  color: var(--p-text-color);
  background-color: transparent;
  line-height: 1.4;
  transition: none;
}

.sidebar-link:hover {
  color: var(--p-text-color);
  background-color: var(--p-content-hover-background);
}

.sidebar-link.active {
  color: var(--p-highlight-color);
  background-color: var(--p-highlight-background);
}

/* Drawn inside the row, so the scrolling sidebar doesn't clip it. */
.sidebar-link:focus-visible {
  outline: var(--p-focus-ring-width) var(--p-focus-ring-style) var(--p-focus-ring-color);
  outline-offset: calc(-1 * var(--p-focus-ring-width));
}

.sidebar-link.collapsed {
  justify-content: center;
  padding-inline: 0;
}

.icon {
  display: flex;
  flex-shrink: 0;
}

.label {
  flex: 1;
  min-width: 0;
}

/* base.css resets font-weight on every element, so the label sets its own. */
.active .label {
  font-weight: 600;
}

.count {
  border-radius: 999px;
}

@media (prefers-reduced-motion: no-preference) {
  .sidebar-link {
    transition:
      color 0.15s,
      background-color 0.15s;
  }
}
</style>
