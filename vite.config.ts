import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit:4096,
  },
  plugins: [svelte()],
})
