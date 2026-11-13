<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { appLocales, localeNames, setLocale } from '@/locales'

const { locale, t } = useI18n()

const options = appLocales.map((value) => ({ value, label: localeNames[value] }))
</script>

<template>
  <SelectButton
    :modelValue="locale"
    :options="options"
    optionLabel="label"
    optionValue="value"
    :allowEmpty="false"
    :aria-label="t('common.language')"
    size="small"
    @update:modelValue="setLocale"
  >
    <!-- Each name carries its own lang, so screen readers pronounce it correctly. -->
    <template #option="{ option }">
      <span :lang="option.value">{{ option.label }}</span>
    </template>
  </SelectButton>
</template>
