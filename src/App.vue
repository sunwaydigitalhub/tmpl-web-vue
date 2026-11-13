<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { usePrimeVue } from 'primevue/config'
import AppLayout from './components/common/AppLayout.vue'
import { i18n, primeVueLocales } from './locales'

const primevue = usePrimeVue()

// PrimeVue's own text and <html lang> follow the current language.
watchEffect(() => {
  const locale = i18n.global.locale.value
  primevue.config.locale = primeVueLocales[locale]
  document.documentElement.lang = locale
})
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>

  <Toast />
  <ConfirmDialog />
</template>
