<script setup lang="ts">
// A page's action bar, the counterpart of the topbar: pinned to the bottom of the window while the
// page scrolls, edge to edge across the content area. Put it last in the view's <main>, with the
// page's buttons inside.
</script>

<template>
  <footer class="base-page-footer">
    <slot />
  </footer>
</template>

<style scoped>
/* The negative margins undo AppLayout's content padding, so the bar reaches the edges and the
   bottom. Being last in the page, it covers whatever scrolls under it. */
.base-page-footer {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  margin: 0 calc(-1 * var(--content-padding-inline)) calc(-1 * var(--content-padding-block));
  padding: 1rem var(--content-padding-inline);
  border-top: 1px solid var(--p-content-border-color);
  background: var(--p-content-background);
}

/* The bar's height with one row of buttons, and a little more, so a field the browser scrolls to
   on focus doesn't end up hidden under it. */
:global(html:has(.base-page-footer)) {
  scroll-padding-bottom: 5.5rem;
}
</style>
