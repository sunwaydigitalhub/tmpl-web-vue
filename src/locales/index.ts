import { createI18n, type PickupPaths } from 'vue-i18n'
import type { PrimeVueLocaleOptions } from 'primevue/config'
import { en as primeVueEn } from 'primelocale/js/en.js'
import { ms as primeVueMs } from 'primelocale/js/ms.js'
import commonEn from './common/en.json'
import commonMs from './common/ms.json'
import exampleEn from './example/en.json'
import exampleMs from './example/ms.json'

// Each module's file holds one top-level key named after the module, so the files spread side by side.
const en = { ...commonEn, ...exampleEn }
const ms = { ...commonMs, ...exampleMs }

// English is the reference shape: type-check fails when ms is missing a key.
export type MessageSchema = typeof en
export type MessageKey = PickupPaths<MessageSchema>

export const appLocales = ['en', 'ms'] as const
export type AppLocale = (typeof appLocales)[number]

// Each language in its own name, so it reads the same whichever language is on.
export const localeNames: Record<AppLocale, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
}

// PrimeVue's own text: paginator, dialog close button, empty messages and aria labels.
export const primeVueLocales: Record<AppLocale, PrimeVueLocaleOptions> = {
  en: primeVueEn,
  ms: primeVueMs,
}

const storageKey = 'locale'

function isAppLocale(value: unknown): value is AppLocale {
  return appLocales.includes(value as AppLocale)
}

function savedLocale(): AppLocale | undefined {
  try {
    const value = localStorage.getItem(storageKey)
    return isAppLocale(value) ? value : undefined
  } catch {
    return undefined
  }
}

// The saved choice, else the first browser language the app has, else English.
function startupLocale(): AppLocale {
  const browserLocale = navigator.languages
    .map((tag) => tag.toLowerCase().split('-')[0])
    .find(isAppLocale)
  return savedLocale() ?? browserLocale ?? 'en'
}

export const i18n = createI18n<[MessageSchema], AppLocale, false>({
  legacy: false,
  locale: startupLocale(),
  fallbackLocale: 'en',
  messages: { en, ms },
})

// Only a choice made in the switcher is saved, so first visits keep following the browser.
export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(storageKey, locale)
  } catch {
    // Storage is blocked, so the choice lasts until the page closes.
  }
}

declare module 'vue-i18n' {
  // Key completion for t() in the editor.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}
