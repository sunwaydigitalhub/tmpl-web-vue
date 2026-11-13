import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' also loads unprefixed keys like PORT. The client still gets only VITE_ keys.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      Components({
        resolvers: [PrimeVueResolver()],
      }),
      // Precompiles the message files. JSON only: the rest of src/locales is app code.
      VueI18nPlugin({
        include: [fileURLToPath(new URL('./src/locales/**/*.json', import.meta.url))],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: Number(env.PORT) || 5173,
      // Exit when the port is taken rather than move to the next free one.
      strictPort: true,
    },
  }
})
