<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BreadcrumbEntry } from '@/types/common'

defineProps<{
  // From the outermost page in. The last is the current page, which has no link.
  entries: BreadcrumbEntry[]
}>()

const { t } = useI18n()
</script>

<template>
  <nav :aria-label="t('common.breadcrumb.label')">
    <ol class="list">
      <li v-for="entry in entries" :key="entry.key" class="entry">
        <RouterLink v-if="entry.to" :to="entry.to" class="link">{{ t(entry.labelKey) }}</RouterLink>
        <span v-else aria-current="page">{{ t(entry.labelKey) }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  color: var(--p-text-color);
  font-size: 0.875rem;
  line-height: 1.4;
  list-style: none;
}

.entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* A slash before every step but the first. Its empty alternative text keeps screen readers from
   reading it out; the plain declaration is for browsers without that syntax. */
.entry + .entry::before {
  content: '/';
  content: '/' / '';
  color: var(--p-text-muted-color);
}

/* Colour, padding, background and transition are all set here, so main.css's global link rules
   don't show through. */
.link {
  padding: 0;
  border-radius: var(--p-border-radius-sm);
  color: var(--p-text-muted-color);
  background-color: transparent;
  transition: none;
}

.link:hover {
  color: var(--p-text-color);
  background-color: transparent;
  text-decoration: underline;
}

.link:focus-visible {
  outline: var(--p-focus-ring-width) var(--p-focus-ring-style) var(--p-focus-ring-color);
  outline-offset: var(--p-focus-ring-offset);
}

@media (prefers-reduced-motion: no-preference) {
  .link {
    transition: color 0.15s;
  }
}
</style>
