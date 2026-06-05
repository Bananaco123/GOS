import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/GOS/',
  plugins: [react()],
  server: {
    port: 5179,
    open: true,
  },
})
