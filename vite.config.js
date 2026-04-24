import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// Define all exercise entry points
const exercises = [
  // Legacy Godot exercises to be migrated
  // 'colourful-semantics',
  // 'think-and-find',
  // 'concept-quest',
  'categorisation',
  // 'story-train',
  
  // React exercise entries
  'hello', // Proof of concept
  'sentence-matching-example', // Framework example exercise
]

// Create input object for multiple entry points
const input = {}
exercises.forEach(exercise => {
  input[exercise] = path.resolve(__dirname, `frontend/src/exercises/${exercise}.tsx`)
})

export default defineConfig({
  base: '/static/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, './static/js/exercises'),
    emptyOutDir: false,
    manifest: "manifest.json",
    rollupOptions: {
      input,
      output: {
        // Output each exercise as a separate bundle
        entryFileNames: '[name]-bundle.js',
        // Don't create separate vendor chunks - inline everything
        // This makes each exercise bundle self-contained
        manualChunks: undefined,
        assetFileNames: `css/[name].css`
      },
    },
    sourcemap: true,
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  server: {
    host: '0.0.0.0',
    // port: 5173,
    hmr: {
    //   host: 'localhost',
      port: 5173,
      // path: '/frontend'
    },
    watch: {
      usePolling: true,
      interval: 1000,  // check every 100ms instead of the default 1000ms
    }
  },
})
