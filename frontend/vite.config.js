import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Corriendo adentro de Docker con el proyecto en un bind mount desde
    // Windows, los eventos nativos de sistema de archivos (inotify) no
    // siempre llegan al contenedor -- Vite se queda sirviendo el bundle
    // viejo aunque el archivo en disco ya haya cambiado. Con polling,
    // chequea los archivos por intervalos en vez de depender de esos
    // eventos, así el hot-reload funciona siempre.
    watch: {
      usePolling: true,
    },
  },
})
