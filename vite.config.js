import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "inline", // Injects registration rules securely
      workbox: {
        // 🔥 THE WHATSAPP FIX: Do not intercept streaming websockets or API backends
        navigateFallbackDenylist: [/^\/socket.io/, /^\/api/],
        runtimeCaching: [
          {
            // Bypasses local socket traffic safely so messages are 100% instant
            urlPattern: ({ url }) => url.pathname.startsWith("/socket.io"),
            handler: "NetworkOnly"
          }
        ]
      },
      manifest: {
        name: "Loved Chat",
        short_name: "LovedChat",
        description: "Secure private real-time chat workspace channels",
        theme_color: "#25d366", // WhatsApp Green Theme
        background_color: "#0b141a",
        display: "standalone", // Forces app-drawer mode, completely hiding Chrome tabs
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});