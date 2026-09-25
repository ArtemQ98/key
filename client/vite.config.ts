import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Не перехватываем /api и /uploads — они не должны кэшироваться SW
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        // Не пытаемся кэшировать запросы к .js, .css и т.д. — пусть идут к Nginx.
        // Только index.html кэшируется как fallback для SPA.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "KEY — аренда автомобилей",
        short_name: "KEY",
        description: "Сервис аренды автомобилей от частных автопарков",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/uploads": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2022",
  },
});