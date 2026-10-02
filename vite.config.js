import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the build portable (static hosts, subpaths, Vercel previews).
export default defineConfig({
  plugins: [react()],
  base: './',
});
