import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Ensure AG Grid React packages are pre-bundled for Vite
    include: ['ag-grid-react', 'ag-grid-community'],
    exclude: ['lucide-react'],
  },
  // Prevent AG Grid from being externalized during SSR/pre-render
  ssr: {
    noExternal: ['ag-grid-react', 'ag-grid-community'],
  },
});
