import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVueI18n from '@intlify/eslint-plugin-vue-i18n'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'
import * as jsoncParser from 'jsonc-eslint-parser'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  // Translation checks. The plugin's own presets would lint every JSON file in the repo, so it is
  // registered here for src only.
  {
    name: 'app/vue-i18n/setup',
    files: ['src/**/*.{vue,ts}', 'src/locales/**/*.json'],
    plugins: { '@intlify/vue-i18n': pluginVueI18n },
    settings: {
      'vue-i18n': {
        localeDir: { pattern: './src/locales/*/*.json', localeKey: 'file' },
        messageSyntaxVersion: '^11.0.0',
      },
    },
  },
  {
    name: 'app/vue-i18n/code',
    files: ['src/**/*.{vue,ts}'],
    rules: {
      '@intlify/vue-i18n/no-missing-keys': 'error',
      '@intlify/vue-i18n/no-v-html': 'error',
    },
  },
  {
    name: 'app/vue-i18n/raw-text',
    files: ['src/**/*.vue'],
    // The create-vue demo pages stay untranslated.
    ignores: [
      'src/views/AboutView.vue',
      'src/components/HelloWorld.vue',
      'src/components/TheWelcome.vue',
      'src/components/WelcomeItem.vue',
    ],
    rules: {
      // PrimeVue text sits in props, so those are checked as well as template text.
      '@intlify/vue-i18n/no-raw-text': [
        'error',
        { attributes: { '/.+/': ['label', 'header', 'placeholder', 'aria-label', 'title'] } },
      ],
    },
  },
  {
    name: 'app/vue-i18n/messages',
    files: ['src/locales/**/*.json'],
    languageOptions: { parser: jsoncParser },
    rules: {
      '@intlify/vue-i18n/no-html-messages': 'error',
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
