import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: la carpeta dist/ funciona desde cualquier subcarpeta o servidor estático
  base: './',
  server: { port: 5173 },
  build: {
    // Phaser se separa en su propio archivo para aprovechar la caché del navegador
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } }
    }
  }
});
