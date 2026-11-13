<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Menu as MenuIcon } from '@lucide/vue'
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb.vue'
import BaseSidebar from '@/components/common/BaseSidebar.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useBreadcrumbStore } from '@/stores/common/breadcrumb'
import { useSidebarStore } from '@/stores/common/sidebar'

const sidebar = useSidebarStore()
const breadcrumb = useBreadcrumbStore()
const route = useRoute()
const { t } = useI18n()

// Narrower than this, the sidebar moves into a drawer opened from the topbar.
const desktopQuery = window.matchMedia('(min-width: 1024px)')
const isDesktop = ref(desktopQuery.matches)
const drawerVisible = ref(false)
const menuButton = useTemplateRef<ComponentPublicInstance>('menuButton')

function onViewportChange(event: MediaQueryListEvent) {
  isDesktop.value = event.matches
  if (event.matches) drawerVisible.value = false
}
desktopQuery.addEventListener('change', onViewportChange)
onBeforeUnmount(() => desktopQuery.removeEventListener('change', onViewportChange))

// The drawer doesn't return focus when it closes, so it goes back to the button that opened it.
function focusMenuButton() {
  const button: HTMLElement | undefined = menuButton.value?.$el
  button?.focus()
}

// Counts are fetched again on every navigation. The API caches them, so this stays cheap.
watch(
  () => route.path,
  () => sidebar.refreshCounts(),
  { immediate: true },
)
</script>

<template>
  <div class="layout">
    <div v-if="isDesktop" class="layout-sidebar">
      <BaseSidebar
        v-model:collapsed="sidebar.collapsed"
        v-model:width="sidebar.width"
        :sections="sidebar.sections"
        resizable
      >
        <template #brand="{ collapsed }">
          <span v-if="!collapsed" class="brand">{{ t('common.appName') }}</span>
        </template>
      </BaseSidebar>
    </div>

    <div class="layout-main">
      <header class="topbar">
        <Button
          v-if="!isDesktop"
          ref="menuButton"
          class="menu-button"
          text
          rounded
          severity="secondary"
          :aria-label="t('common.sidebar.openMenu')"
          :aria-expanded="drawerVisible"
          @click="drawerVisible = true"
        >
          <template #icon>
            <MenuIcon :size="22" />
          </template>
        </Button>
        <LocaleSwitcher />
      </header>

      <!-- A plain container: each view renders its own <main>. -->
      <div class="content">
        <!-- Only a page below another page gets a breadcrumb; a top-level page's heading already
             names it. -->
        <BaseBreadcrumb
          v-if="breadcrumb.trail.length > 1"
          class="breadcrumb"
          :entries="breadcrumb.trail"
        />
        <slot />
      </div>
    </div>

    <Drawer
      v-if="!isDesktop"
      v-model:visible="drawerVisible"
      :aria-label="t('common.sidebar.menu')"
      blockScroll
      :dt="{ content: { padding: '0' } }"
      @after-hide="focusMenuButton"
    >
      <template #header>
        <span class="brand">{{ t('common.appName') }}</span>
      </template>
      <BaseSidebar
        class="drawer-sidebar"
        :sections="sidebar.sections"
        :collapsible="false"
        @navigate="drawerVisible = false"
      />
    </Drawer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex: 1;
}

/* Stays in view while the page scrolls; the sidebar scrolls its own entries. */
.layout-sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  flex-shrink: 0;
  height: 100dvh;
  border-right: 1px solid var(--p-content-border-color);
}

.layout-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  background: var(--color-background-soft);
}

/* Stays at the top while the page scrolls under it. */
.topbar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  min-height: 4rem;
  padding: 0.75rem 2rem;
  border-bottom: 1px solid var(--p-content-border-color);
  background: var(--p-content-background);
}

.menu-button {
  margin-right: auto;
}

/* A flex column, so a view that fills the height (flex: 1) still can. Isolated, so no z-index
   inside a page (PrimeVue's hidden checkbox inputs use 1) can rise above the topbar. The padding
   is kept in variables so BasePageFooter can reach past it to the edges. */
.content {
  --content-padding-block: 2rem;
  --content-padding-inline: 2rem;
  isolation: isolate;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--content-padding-block) var(--content-padding-inline);
}

.breadcrumb {
  margin-bottom: 1rem;
}

.brand {
  color: var(--p-text-color);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
}

.drawer-sidebar {
  --sidebar-width: 100%;
}

/* The topbar's height and a little more, so a field the browser scrolls to on focus doesn't end
   up hidden under it. */
:global(html) {
  scroll-padding-top: 4.5rem;
}

@media (max-width: 1023px) {
  .topbar {
    padding-inline: 1rem;
  }

  .content {
    --content-padding-inline: 1rem;
  }
}
</style>
