import { defineConfig } from 'vite'
import VitePages from 'vite-plugin-pages';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [VitePages()],
  base: '/cget-bounding-volume/'
})
