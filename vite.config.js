import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        formulario: resolve(__dirname, 'formularioCliente.html')
      }
    }
  }
});
