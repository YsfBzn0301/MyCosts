import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages serves project sites under /<repo>/. The workflow sets VITE_BASE;
  // lokal bleibt es bei '/'.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
});
