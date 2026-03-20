import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'static/js/dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                multiple_choice: 'static/js/exercises/multiple_choice.jsx',
            },
            output: {
                // Deterministic filenames so Django template references stay stable
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name][extname]',
            },
        },
    },
});
