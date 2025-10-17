import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'tensorflow': [
            '@tensorflow/tfjs-core', 
            '@tensorflow/tfjs-backend-webgl', 
            '@tensorflow/tfjs-backend-cpu', 
            '@tensorflow-models/pose-detection',
            '@tensorflow-models/hand-pose-detection',
            '@mediapipe/hands'
          ],
        },
      },
    },
  },
}));
