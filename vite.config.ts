
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  define: {
    // Позволяет коду использовать process.env без падения приложения
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  }
});
